import { createFileRoute } from '@tanstack/react-router';
import { decrypt } from '../../utils/veylo-encrypt.js';
import { activeClient, json, readObject } from '@/lib/veylo-api.server';

export const Route = createFileRoute('/api/veylo/whatsapp/send')({
  server: { handlers: {
    POST: async ({ request }) => {
      const context = await activeClient(request);
      if ('response' in context) return context.response;
      if (context.client.subscription_status !== 'active' || !context.client.subscription_ends_at || Date.parse(context.client.subscription_ends_at) <= Date.now()) {
        return json({ error: 'An active Veylo subscription is required to send messages' }, 402);
      }
      const body = await readObject(request);
      const to = body?.to;
      const text = body?.text;
      if (typeof to !== 'string' || !/^\+?[0-9]{7,15}$/.test(to.replace(/[\s()-]/g, '')) || typeof text !== 'string' || !text.trim() || text.length > 4096) {
        return json({ error: 'Provide a valid recipient number and a message of 1–4096 characters' }, 400);
      }
      if (context.client.status !== 'active') return json({ error: 'WhatsApp connection is not active' }, 409);
      let token: string;
      try { token = decrypt(context.client.access_token_encrypted); }
      catch { return json({ error: 'Stored WhatsApp credential cannot be decrypted' }, 500); }
      const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(context.client.phone_number_id)}/messages`, {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'text', text: { body: text.trim() } }),
        signal: AbortSignal.timeout(15_000),
      }).catch(() => null);
      if (!response) return json({ error: 'Meta request failed' }, 502);
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        const waMessageId = result?.messages?.[0]?.id;
        const { error } = await context.db.from('veylo_messages').insert({
          client_id: context.client.id, from_number: context.client.display_number, to_number: to,
          direction: 'outbound', text_content: text.trim(), whatsapp_message_id: typeof waMessageId === 'string' ? waMessageId : null,
        });
        if (error) return json({ error: 'Message was sent but could not be recorded' }, 500);
      }
      return json(result, response.status);
    },
  } },
});
