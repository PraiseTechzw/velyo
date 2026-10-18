import { createFileRoute } from "@tanstack/react-router";
import { verifyMetaChallenge } from "@/lib/whatsapp-webhook";

async function readWebhookBody(request: Request, maxBytes: number) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const challenge = verifyMetaChallenge(
          new URL(request.url),
          process.env["META_WHATSAPP_VERIFY_TOKEN"],
        );
        return challenge === null
          ? new Response("Webhook verification failed.", { status: 403 })
          : new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
      },
      POST: async ({ request }) => {
        const declaredLength = Number(request.headers.get("content-length") ?? 0);
        if (declaredLength > 1_000_000) return new Response("Payload too large.", { status: 413 });
        const rawBody = await readWebhookBody(request, 1_000_000);
        if (rawBody === null) {
          return new Response("Payload too large.", { status: 413 });
        }
        const { acceptMetaWebhook } = await import("@/lib/whatsapp-webhook.server");
        const result = await acceptMetaWebhook(rawBody, request.headers.get("x-hub-signature-256"));
        return new Response(result.message, { status: result.status });
      },
    },
  },
});
