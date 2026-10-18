import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { rpc },
}));

import { acceptMetaWebhook } from "@/lib/whatsapp-webhook.server";

describe("Meta webhook server handler", () => {
  const appSecret = "local-test-meta-secret";
  const oldSecret = process.env["META_WHATSAPP_APP_SECRET"];
  const signedBody = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "test-phone-id" },
              messages: [
                {
                  id: "wamid.test.1",
                  from: "263771234567",
                  timestamp: "1792340000",
                  type: "text",
                  text: { body: "Hello Veylo" },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  function signature(body: string) {
    return `sha256=${createHmac("sha256", appSecret).update(body, "utf8").digest("hex")}`;
  }

  beforeEach(() => {
    process.env["META_WHATSAPP_APP_SECRET"] = appSecret;
    rpc.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (oldSecret === undefined) delete process.env["META_WHATSAPP_APP_SECRET"];
    else process.env["META_WHATSAPP_APP_SECRET"] = oldSecret;
  });

  it("rejects invalid signatures before calling the database", async () => {
    const result = await acceptMetaWebhook(signedBody, "sha256=invalid");

    expect(result.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("persists signed events and acknowledges already-deduplicated delivery", async () => {
    rpc.mockResolvedValue({
      data: { accepted: true, duplicate: true },
      error: null,
    });

    const result = await acceptMetaWebhook(signedBody, signature(signedBody));

    expect(result).toEqual({ status: 200, message: "Webhook accepted." });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "process_whatsapp_event",
      expect.objectContaining({
        p_phone_number_id: "test-phone-id",
        p_event_type: "message",
        p_payload: expect.objectContaining({ id: "wamid.test.1", from: "263771234567" }),
      }),
    );
  });

  it("asks Meta to retry when event persistence fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "DB_UNAVAILABLE" } });

    const result = await acceptMetaWebhook(signedBody, signature(signedBody));

    expect(result.status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("returns a client error for malformed signed JSON without database writes", async () => {
    const body = "{";

    const result = await acceptMetaWebhook(body, signature(body));

    expect(result.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
