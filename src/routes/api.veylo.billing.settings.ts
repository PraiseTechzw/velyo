import { createFileRoute } from '@tanstack/react-router';
import { adminDb, authenticate, json, readObject } from '@/lib/veylo-api.server';

export const Route = createFileRoute('/api/veylo/billing/settings')({
  server: { handlers: {
    POST: async ({ request }) => {
      const auth = await authenticate(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await readObject(request);
      if (typeof body?.paynow_pass_fees !== 'boolean') return json({ error: 'Invalid billing preference' }, 400);
      const db = adminDb();
      const { data: client } = await db.from('veylo_clients').select('id').eq('user_id', auth.userId).maybeSingle();
      if (!client) return json({ error: 'WhatsApp is not configured' }, 404);
      const { error } = await db.from('veylo_settings').upsert({ client_id: client.id, paynow_pass_fees: body.paynow_pass_fees }, { onConflict: 'client_id' });
      return error ? json({ error: 'Could not save billing preference' }, 500) : json({ ok: true });
    },
  } },
});
