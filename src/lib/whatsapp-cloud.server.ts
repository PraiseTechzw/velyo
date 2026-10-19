import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function metaErrorDetail(
  error:
    | { code?: number; error_subcode?: number; message?: string; error_user_msg?: string }
    | undefined,
  responseStatus: number,
  secret?: string,
) {
  const code = error?.code ?? responseStatus;
  const subcode = error?.error_subcode ? `/${error.error_subcode}` : "";
  const detail = (error?.error_user_msg || error?.message || "")
    .replaceAll(secret || "\u0000", "[redacted]")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 260);
  return `Meta error ${code}${subcode}${detail ? `: ${detail}` : ""}`;
}

function decodeKey() {
  const keyText = process.env["WHATSAPP_TOKEN_ENCRYPTION_KEY"];
  if (!keyText) throw new Error("WhatsApp token encryption is not configured.");
  const key = Buffer.from(keyText, "base64");
  if (key.length !== 32)
    throw new Error("WhatsApp token encryption key must be 32 bytes encoded as base64.");
  return key;
}

export function decryptWhatsAppToken(value: string) {
  const [version, ivText, tagText, ciphertextText] = value.split(":");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) {
    throw new Error("Stored WhatsApp credential has an unsupported format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", decodeKey(), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptWhatsAppToken(value: string) {
  if (!value || value.length > 5000) throw new Error("Invalid WhatsApp access token.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", decodeKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export async function fetchWhatsAppTemplates(businessId: string) {
  const version = process.env["WHATSAPP_GRAPH_API_VERSION"];
  if (!version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("WhatsApp template lookup is not configured on this server.");
  }
  const [
    { data: integration, error: integrationError },
    { data: credentials, error: credentialsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("whatsapp_integrations")
      .select("business_account_id,status")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabaseAdmin
      .from("business_credentials")
      .select("encrypted_token")
      .eq("business_id", businessId)
      .maybeSingle(),
  ]);
  if (integrationError || credentialsError) {
    throw new Error("WhatsApp templates could not be loaded.");
  }
  if (integration?.status !== "connected" || !credentials?.encrypted_token) {
    return { connected: false as const, templates: [] };
  }

  const accessToken = decryptWhatsAppToken(credentials.encrypted_token);
  const url = new URL(
    `https://graph.facebook.com/${version}/${encodeURIComponent(integration.business_account_id)}/message_templates`,
  );
  url.searchParams.set("fields", "id,name,status,category,language");
  url.searchParams.set("limit", "100");
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(12_000),
  });
  const result = (await response.json().catch(() => null)) as {
    data?: Array<Record<string, unknown>>;
  } | null;
  if (!response.ok || !Array.isArray(result?.data)) {
    throw new Error(
      "Meta could not load message templates. Check the WhatsApp account permissions.",
    );
  }

  const templates = result.data.flatMap((item) => {
    const id = item["id"];
    const name = item["name"];
    const status = item["status"];
    const category = item["category"];
    const language = item["language"];
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof status !== "string" ||
      typeof category !== "string" ||
      typeof language !== "string"
    ) {
      return [];
    }
    return [{ id, name, status, category, language }];
  });
  return { connected: true as const, templates };
}

export async function completeEmbeddedWhatsAppSignup(input: {
  businessId: string;
  code: string;
  phoneNumberId: string;
  businessAccountId: string;
}) {
  const appId = process.env["META_APP_ID"];
  const appSecret = process.env["META_WHATSAPP_APP_SECRET"];
  const version = process.env["WHATSAPP_GRAPH_API_VERSION"];
  if (!appId || !appSecret || !version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("Meta self-serve connection is not configured on the Veylo server.");
  }

  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", appId);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", input.code);
  const tokenResponse = await fetch(tokenUrl, { signal: AbortSignal.timeout(12_000) });
  const tokenData = (await tokenResponse.json().catch(() => null)) as {
    access_token?: string;
    error?: { code?: number };
  } | null;
  if (!tokenResponse.ok || !tokenData?.access_token) {
    throw new Error(
      `Meta could not finish the authorization (error ${tokenData?.error?.code ?? tokenResponse.status}). Please try connecting again.`,
    );
  }

  const debugUrl = new URL(`https://graph.facebook.com/${version}/debug_token`);
  debugUrl.searchParams.set("input_token", tokenData.access_token);
  debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`);
  const debugResponse = await fetch(debugUrl, { signal: AbortSignal.timeout(12_000) });
  const debugData = (await debugResponse.json().catch(() => null)) as {
    data?: { app_id?: string; is_valid?: boolean; scopes?: string[] };
  } | null;
  const scopes = debugData?.data?.scopes ?? [];
  if (
    !debugResponse.ok ||
    !debugData?.data?.is_valid ||
    debugData.data.app_id !== appId ||
    !scopes.includes("whatsapp_business_management") ||
    !scopes.includes("whatsapp_business_messaging")
  ) {
    throw new Error(
      "Meta authorization is missing required WhatsApp permissions. Reconnect and approve the requested permissions.",
    );
  }

  await verifyAndStoreWhatsAppConnection({
    businessId: input.businessId,
    phoneNumberId: input.phoneNumberId,
    businessAccountId: input.businessAccountId,
    accessToken: tokenData.access_token,
  });
}

export async function verifyAndStoreWhatsAppConnection(input: {
  businessId: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
}) {
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    throw new Error("WhatsApp connection storage is not configured on the server.");
  }
  decodeKey();
  const version = process.env["WHATSAPP_GRAPH_API_VERSION"];
  if (!version || !/^v\d+\.\d+$/.test(version)) {
    throw new Error("Set WHATSAPP_GRAPH_API_VERSION to a supported Meta Graph API version.");
  }
  const graph = `https://graph.facebook.com/${version}`;
  const headers = { authorization: `Bearer ${input.accessToken}` };
  const phoneResponse = await fetch(
    `${graph}/${encodeURIComponent(input.phoneNumberId)}?fields=id,display_phone_number`,
    {
      headers,
      signal: AbortSignal.timeout(12_000),
    },
  );
  const phoneData = (await phoneResponse.json().catch(() => null)) as {
    id?: string;
    display_phone_number?: string;
    error?: { code?: number; error_subcode?: number; message?: string; error_user_msg?: string };
  } | null;
  if (!phoneResponse.ok || phoneData?.id !== input.phoneNumberId) {
    throw new Error(
      `Meta could not verify this phone number (${metaErrorDetail(phoneData?.error, phoneResponse.status, input.accessToken)}). Confirm the ID and that this token’s system user has access to the WhatsApp business account and phone-number asset.`,
    );
  }

  const subscribeResponse = await fetch(
    `${graph}/${encodeURIComponent(input.businessAccountId)}/subscribed_apps`,
    {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(12_000),
    },
  );
  const subscription = (await subscribeResponse.json().catch(() => null)) as {
    success?: boolean;
    error?: { code?: number; error_subcode?: number; message?: string; error_user_msg?: string };
  } | null;
  if (!subscribeResponse.ok || subscription?.success !== true) {
    throw new Error(
      `Meta verified the phone, but webhook subscription failed (${metaErrorDetail(subscription?.error, subscribeResponse.status, input.accessToken)}). Check app webhook setup and WhatsApp business permissions.`,
    );
  }

  const { error } = await supabaseAdmin.rpc("store_whatsapp_connection", {
    p_business_id: input.businessId,
    p_phone_number_id: input.phoneNumberId,
    p_business_account_id: input.businessAccountId,
    p_display_phone_number: phoneData.display_phone_number ?? "",
    p_encrypted_token: encryptWhatsAppToken(input.accessToken),
  });
  if (error)
    throw new Error(
      "Meta setup succeeded, but Veylo could not save the connection. Ask an administrator to check server configuration.",
    );
}

export async function deliverWhatsAppText(input: {
  messageId: string;
  businessId: string;
  phoneNumberId: string;
  recipient: string;
  text: string;
}) {
  try {
    const version = process.env["WHATSAPP_GRAPH_API_VERSION"];
    if (!version || !/^v\d+\.\d+$/.test(version)) {
      throw new Error("Set WHATSAPP_GRAPH_API_VERSION to a supported Meta Graph API version.");
    }
    const { data, error } = await supabaseAdmin
      .from("business_credentials")
      .select("encrypted_token")
      .eq("business_id", input.businessId)
      .single();
    if (error || !data?.encrypted_token)
      throw new Error("No WhatsApp access token is stored for this workspace.");
    const accessToken = decryptWhatsAppToken(data.encrypted_token);
    const response = await fetch(
      `https://graph.facebook.com/${version}/${encodeURIComponent(input.phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.recipient,
          type: "text",
          text: { body: input.text, preview_url: false },
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    const result = (await response.json().catch(() => null)) as {
      messages?: Array<{ id?: string }>;
      error?: { code?: number };
    } | null;
    const providerMessageId = result?.messages?.[0]?.id;
    if (!response.ok || !providerMessageId) {
      const code = result?.error?.code ? String(result.error.code) : `http_${response.status}`;
      await supabaseAdmin.rpc("mark_whatsapp_message_failed", {
        p_message_id: input.messageId,
        p_error_code: code,
      });
      return {
        ok: false as const,
        error: "WhatsApp could not accept this message. Check the connection and try again.",
      };
    }
    const updated = await supabaseAdmin.rpc("mark_whatsapp_message_sent", {
      p_message_id: input.messageId,
      p_provider_message_id: providerMessageId,
    });
    if (updated.error || !updated.data) {
      console.error("WhatsApp accepted a message but its local status could not be updated.", {
        messageId: input.messageId,
      });
      return {
        ok: false as const,
        error:
          "WhatsApp accepted the message, but its status could not be saved. Refresh the conversation.",
      };
    }
    return { ok: true as const, messageId: input.messageId };
  } catch (error) {
    const safeCode =
      error instanceof Error && error.message.includes("encryption")
        ? "credentials_unavailable"
        : "send_failed";
    try {
      await supabaseAdmin.rpc("mark_whatsapp_message_failed", {
        p_message_id: input.messageId,
        p_error_code: safeCode,
      });
    } catch {
      // Keep error handling safe if the database is also unavailable.
    }
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "WhatsApp message failed.",
    };
  }
}
