import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { normalizeMetaWebhook, verifyMetaSignature } from "./whatsapp-webhook";

export async function acceptMetaWebhook(rawBody: string, signature: string | null) {
  const appSecret = process.env["META_WHATSAPP_APP_SECRET"];
  if (!appSecret) return { status: 503, message: "WhatsApp webhook signing is not configured." };
  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    return { status: 401, message: "Invalid webhook signature." };
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { status: 400, message: "Invalid webhook payload." };
  }
  const events = normalizeMetaWebhook(body);
  if (!events.length) return { status: 200, message: "No supported WhatsApp events." };

  try {
    for (const event of events) {
      const { data, error } = await supabaseAdmin.rpc("process_whatsapp_event", {
        p_event_key: event.key,
        p_phone_number_id: event.phoneNumberId,
        p_event_type: event.type,
        p_payload: event.payload as Json,
      });
      if (
        error ||
        (data &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          "accepted" in data &&
          data["accepted"] === false)
      ) {
        console.error("WhatsApp webhook event processing failed", {
          eventKey: event.key,
          errorCode: error?.code,
        });
        return {
          status: 503,
          message: "Webhook event processing failed; Meta may retry delivery.",
        };
      }
    }
  } catch {
    console.error("WhatsApp webhook processing is unavailable.");
    return { status: 503, message: "Webhook processing is temporarily unavailable." };
  }
  return { status: 200, message: "Webhook accepted." };
}
