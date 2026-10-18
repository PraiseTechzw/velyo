import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { decryptWhatsAppToken, encryptWhatsAppToken } from "@/lib/whatsapp-cloud.server";
import {
  normalizeMetaWebhook,
  verifyMetaChallenge,
  verifyMetaSignature,
} from "@/lib/whatsapp-webhook";

describe("WhatsApp webhook security and parsing", () => {
  const rawBody = '{"object":"whatsapp_business_account","entry":[]}';
  const secret = "test-meta-app-secret";

  it("accepts only a matching Meta challenge request", () => {
    const valid = new URL(
      "https://veylo.example/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=abc123",
    );
    const invalid = new URL(
      "https://veylo.example/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123",
    );
    expect(verifyMetaChallenge(valid, "verify-me")).toBe("abc123");
    expect(verifyMetaChallenge(invalid, "verify-me")).toBeNull();
    expect(verifyMetaChallenge(valid, undefined)).toBeNull();
  });

  it("checks the raw request body HMAC and rejects malformed or invalid signatures", () => {
    const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(verifyMetaSignature(rawBody, `sha256=${digest}`, secret)).toBe(true);
    expect(verifyMetaSignature(`${rawBody} `, `sha256=${digest}`, secret)).toBe(false);
    expect(verifyMetaSignature(rawBody, "sha256=bad", secret)).toBe(false);
    expect(verifyMetaSignature(rawBody, null, secret)).toBe(false);
  });

  it("normalizes incoming messages and statuses with stable duplicate keys", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "phone-1" },
                contacts: [{ wa_id: "263771234567", profile: { name: "Tariro" } }],
                messages: [
                  {
                    id: "wamid.1",
                    from: "263771234567",
                    timestamp: "1792340000",
                    type: "text",
                    text: { body: "Hello" },
                  },
                ],
                statuses: [{ id: "wamid.2", status: "delivered", timestamp: "1792340001" }],
              },
            },
          ],
        },
      ],
    };
    const events = normalizeMetaWebhook(body);
    expect(events).toHaveLength(2);
    expect(events[0]?.payload["contact_name"]).toBe("Tariro");
    expect(events[0]?.key).toBe(normalizeMetaWebhook(body)[0]?.key);
    expect(events[0]?.key).not.toBe(events[1]?.key);
    expect(normalizeMetaWebhook({ entry: "invalid" })).toEqual([]);
  });
});

describe("WhatsApp token encryption", () => {
  const previousKey = process.env["WHATSAPP_TOKEN_ENCRYPTION_KEY"];
  afterEach(() => {
    if (previousKey === undefined) delete process.env["WHATSAPP_TOKEN_ENCRYPTION_KEY"];
    else process.env["WHATSAPP_TOKEN_ENCRYPTION_KEY"] = previousKey;
  });

  it("encrypts tokens with authenticated encryption and rejects tampering", () => {
    process.env["WHATSAPP_TOKEN_ENCRYPTION_KEY"] = Buffer.alloc(32, 7).toString("base64");
    const token = "meta-test-token-do-not-log";
    const encrypted = encryptWhatsAppToken(token);
    expect(encrypted).not.toContain(token);
    expect(decryptWhatsAppToken(encrypted)).toBe(token);
    expect(() => decryptWhatsAppToken(`${encrypted.slice(0, -4)}AAAA`)).toThrow();
  });
});
