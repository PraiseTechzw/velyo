import { createHmac, timingSafeEqual } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';
import { adminDb, json } from '@/lib/veylo-api.server';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute('/api/webhook/whatsapp')({
  server: { handlers: {
    GET: async ({ request }) => {
      const url = new URL(request.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token') ?? '';
      const challenge = url.searchParams.get('hub.challenge');
      const expected = process.env.VERIFY_TOKEN;
      if (!expected || mode !== 'subscribe' || !challenge || !safeEqual(token, expected)) return new Response('Webhook verification failed', { status: 403 });
      return new Response(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
    },
    POST: async ({ request }) => {
      const declaredLength = Number(request.headers.get('content-length') ?? 0);
      if (declaredLength > 1_000_000) return new Response('Payload too large', { status: 413 });
      if (!request.body) return new Response('Invalid body', { status: 400 });
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 1_000_000) { await reader.cancel(); return new Response('Payload too large', { status: 413 }); }
        chunks.push(value);
      }
      const rawBytes = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) { rawBytes.set(chunk, offset); offset += chunk.byteLength; }
      const raw = new TextDecoder().decode(rawBytes);
      const appSecret = process.env.VEYLO_META_APP_SECRET;
      const signature = request.headers.get('x-hub-signature-256') ?? '';
      if (!appSecret || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return new Response('Invalid signature', { status: 401 });
      const expected = `sha256=${createHmac('sha256', appSecret).update(raw).digest('hex')}`;
      if (!safeEqual(signature.toLowerCase(), expected)) return new Response('Invalid signature', { status: 401 });
      let payload: any;
      try { payload = JSON.parse(raw); }
      catch { return new Response('Invalid JSON', { status: 400 }); }
      const db = adminDb();
      for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
        for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
          const value = change?.value;
          const phoneId = value?.metadata?.phone_number_id;
          if (typeof phoneId !== 'string') continue;
          const { data: client } = await db.from('veylo_clients').select('id, subscription_status, subscription_ends_at').eq('phone_number_id', phoneId).eq('status', 'active').maybeSingle();
          if (!client) continue;
          if (client.subscription_status !== 'active' || !client.subscription_ends_at || Date.parse(client.subscription_ends_at) <= Date.now()) {
            if (client.subscription_status === 'active') await db.from('veylo_clients').update({ subscription_status: 'past_due' }).eq('id', client.id);
            continue;
          }
          for (const message of Array.isArray(value.messages) ? value.messages : []) {
            if (typeof message?.id !== 'string' || typeof message?.from !== 'string') continue;
            const text = message?.type === 'text' && typeof message?.text?.body === 'string' ? message.text.body : '';
            const { data: inserted, error } = await db.from('veylo_messages').upsert({
              client_id: client.id, from_number: message.from,
              to_number: value.metadata.display_phone_number ?? '', direction: 'inbound',
              text_content: text, whatsapp_message_id: message.id,
            }, { onConflict: 'whatsapp_message_id', ignoreDuplicates: true }).select('id').maybeSingle();
            if (!error && inserted) await db.rpc('increment_veylo_messages_used', { p_client_id: client.id });
          }
        }
      }
      return new Response('EVENT_RECEIVED', { status: 200 });
    },
  } },
});
