import { createFileRoute } from '@tanstack/react-router';
import { encrypt } from '../../utils/veylo-encrypt.js';
import { adminDb, authenticate, json, readObject } from '@/lib/veylo-api.server';

export const Route = createFileRoute('/api/veylo/settings/whatsapp')({
  server: { handlers: {
    GET: async ({ request }) => {
      const auth = await authenticate(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const db = adminDb();
      const { data: client, error } = await db.from('veylo_clients')
        .select('id, waba_id, phone_number_id, display_number, status, messages_used, created_at')
        .eq('user_id', auth.userId).maybeSingle();
      if (error) return json({ error: 'Could not load WhatsApp status' }, 500);
      const url = new URL('/api/webhook/whatsapp', process.env.BASE_URL || new URL(request.url).origin).toString();
      return json({ client, webhookUrl: url, verifyToken: process.env.VERIFY_TOKEN ?? '', metaAppId: process.env.VEYLO_META_APP_ID ?? '' });
    },
    POST: async ({ request }) => {
      const auth = await authenticate(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const body = await readObject(request);
      const wabaId = body?.waba_id;
      const phoneId = body?.phone_number_id;
      const token = body?.access_token;
      const displayNumber = body?.display_number;
      if (![wabaId, phoneId, token, displayNumber].every((value) => typeof value === 'string' && value.trim())
        || String(phoneId).length > 100 || String(token).length > 4096) return json({ error: 'Invalid WhatsApp details' }, 400);
      const verify = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(String(phoneId))}`, {
        headers: { authorization: `Bearer ${String(token)}` },
        signal: AbortSignal.timeout(12_000),
      }).catch(() => null);
      if (!verify?.ok) return json({ error: 'Invalid token or phone number ID' }, 400);
      const db = adminDb();
      const [{ data: business }, { data: current }] = await Promise.all([
        db.from('businesses').select('name').eq('owner_id', auth.userId).maybeSingle(),
        db.from('veylo_clients').select('id').eq('user_id', auth.userId).maybeSingle(),
      ]);
      const payload = {
        user_id: auth.userId,
        business_name: business?.name ?? '',
        waba_id: String(wabaId).trim(),
        phone_number_id: String(phoneId).trim(),
        display_number: String(displayNumber).trim(),
        access_token_encrypted: encrypt(String(token)),
        status: 'active',
      };
      const result = current
        ? await db.from('veylo_clients').update(payload).eq('id', current.id).select('id').single()
        : await db.from('veylo_clients').insert(payload).select('id').single();
      if (result.error) return json({ error: 'Could not save WhatsApp connection' }, 500);
      return json({ ok: true });
    },
  } },
});
