import { createFileRoute } from '@tanstack/react-router';
import { decrypt } from '../../utils/veylo-encrypt.js';
import { activeClient, json } from '@/lib/veylo-api.server';

export const Route = createFileRoute('/api/veylo/whatsapp/test')({
  server: { handlers: {
    POST: async ({ request }) => {
      const context = await activeClient(request);
      if ('response' in context) return context.response;
      if (context.client.status !== 'active' || !context.client.display_number) return json({ error: 'Connect WhatsApp and set a display number first' }, 400);
      let token: string;
      try { token = decrypt(context.client.access_token_encrypted); }
      catch { return json({ error: 'Stored WhatsApp credential cannot be decrypted' }, 500); }
      const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(context.client.phone_number_id)}/messages`, {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: context.client.display_number.replace(/\D/g, ''), type: 'template', template: { name: 'hello_world', language: { code: 'en_US' } } }),
        signal: AbortSignal.timeout(15_000),
      }).catch(() => null);
      if (!response) return json({ error: 'Meta request failed' }, 502);
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        const waMessageId = result?.messages?.[0]?.id;
        if (typeof waMessageId === 'string') await context.db.from('veylo_messages').insert({
          client_id: context.client.id, from_number: context.client.display_number, to_number: context.client.display_number,
          direction: 'outbound', text_content: '[hello_world test template]', whatsapp_message_id: waMessageId,
        });
      }
      return json(result, response.status);
    },
  } },
});
