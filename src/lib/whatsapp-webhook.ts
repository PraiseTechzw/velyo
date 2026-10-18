import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function constantTimeTextEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export type WhatsAppNormalizedEvent = {
  key: string;
  phoneNumberId: string;
  type: "message" | "status";
  payload: Record<string, unknown>;
};

export function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith("sha256=") || !appSecret) return false;
  const provided = signature.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const actual = Buffer.from(provided, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyMetaChallenge(url: URL, verifyToken: string | undefined) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (
    !verifyToken ||
    mode !== "subscribe" ||
    !token ||
    !constantTimeTextEqual(token, verifyToken) ||
    !challenge
  )
    return null;
  return challenge;
}

export function normalizeMetaWebhook(body: unknown): WhatsAppNormalizedEvent[] {
  if (!body || typeof body !== "object") return [];
  const entries = (body as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) return [];
  const events: WhatsAppNormalizedEvent[] = [];

  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !Array.isArray((entry as { changes?: unknown }).changes)
    )
      continue;
    for (const change of (entry as { changes: unknown[] }).changes) {
      if (!change || typeof change !== "object") continue;
      const value = (change as { value?: unknown }).value;
      if (!value || typeof value !== "object") continue;
      const v = value as {
        metadata?: { phone_number_id?: unknown };
        contacts?: Array<{ wa_id?: unknown; profile?: { name?: unknown } }>;
        messages?: Array<Record<string, unknown>>;
        statuses?: Array<Record<string, unknown>>;
      };
      const phoneNumberId =
        typeof v.metadata?.phone_number_id === "string" ? v.metadata.phone_number_id : "";
      if (!phoneNumberId) continue;

      for (const message of Array.isArray(v.messages) ? v.messages : []) {
        if (!message || typeof message !== "object") continue;
        const id = typeof message["id"] === "string" ? message["id"] : "";
        const from = typeof message["from"] === "string" ? message["from"] : "";
        if (!id || !from) continue;
        const contact = (Array.isArray(v.contacts) ? v.contacts : []).find(
          (candidate) => candidate && typeof candidate === "object" && candidate.wa_id === from,
        );
        const payload = {
          ...message,
          contact_name: typeof contact?.profile?.name === "string" ? contact.profile.name : "",
        };
        events.push({
          key: createHash("sha256").update(`${phoneNumberId}:message:${id}`).digest("hex"),
          phoneNumberId,
          type: "message",
          payload,
        });
      }

      for (const status of Array.isArray(v.statuses) ? v.statuses : []) {
        if (!status || typeof status !== "object") continue;
        const id = typeof status["id"] === "string" ? status["id"] : "";
        const state = typeof status["status"] === "string" ? status["status"] : "";
        const timestamp = typeof status["timestamp"] === "string" ? status["timestamp"] : "";
        if (!id || !state || !timestamp) continue;
        events.push({
          key: createHash("sha256")
            .update(`${phoneNumberId}:status:${id}:${state}:${timestamp}`)
            .digest("hex"),
          phoneNumberId,
          type: "status",
          payload: status,
        });
      }
    }
  }
  return events;
}
