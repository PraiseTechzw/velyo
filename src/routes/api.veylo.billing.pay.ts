import { randomUUID } from 'node:crypto';
import { createFileRoute } from '@tanstack/react-router';
import { adminDb, authenticate, json } from '@/lib/veylo-api.server';
import { parsePaynowResponse, paynowHash, validatePaynowMessage } from '@/lib/veylo-paynow.server';

export const Route = createFileRoute('/api/veylo/billing/pay')({
  server: { handlers: {
    GET: async ({ request }) => {
      const auth = await authenticate(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const db = adminDb();
      const { data: client } = await db.from('veylo_clients').select('id, subscription_status, subscription_ends_at').eq('user_id', auth.userId).maybeSingle();
      if (!client) return json({ error: 'No Veylo client record' }, 404);
      const [{ data: settings }, { data: payment }] = await Promise.all([
        db.from('veylo_settings').select('paynow_pass_fees').eq('client_id', client.id).maybeSingle(),
        db.from('payments').select('amount, status, created_at').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const expired = client.subscription_status === 'active' && (!client.subscription_ends_at || Date.parse(client.subscription_ends_at) <= Date.now());
      const subscriptionStatus = expired ? 'past_due' : client.subscription_status;
      if (expired) await db.from('veylo_clients').update({ subscription_status: 'past_due' }).eq('id', client.id);
      return json({ subscriptionStatus, subscriptionEndsAt: client.subscription_ends_at, passFees: settings?.paynow_pass_fees ?? true, latestPayment: payment ?? null });
    },
    POST: async ({ request }) => {
      const auth = await authenticate(request);
      if (!auth) return json({ error: 'Unauthorized' }, 401);
      const integrationId = process.env.PAYNOW_INTEGRATION_ID;
      const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
      const baseUrl = process.env.BASE_URL;
      if (!integrationId || !integrationKey || !baseUrl) return json({ error: 'Veylo Paynow is not configured' }, 503);
      let siteUrl: URL;
      try { siteUrl = new URL(baseUrl); }
      catch { return json({ error: 'BASE_URL must be a valid absolute URL' }, 503); }
      if (siteUrl.protocol !== 'https:' && siteUrl.hostname !== 'localhost') return json({ error: 'BASE_URL must use HTTPS' }, 503);
      const db = adminDb();
      const { data: client } = await db.from('veylo_clients').select('id, subscription_status, subscription_ends_at').eq('user_id', auth.userId).maybeSingle();
      if (!client) return json({ error: 'Set up WhatsApp before starting a Veylo subscription' }, 404);
      const { data: settings } = await db.from('veylo_settings').select('paynow_pass_fees').eq('client_id', client.id).maybeSingle();
      const reference = `VY-${randomUUID()}`;
      const amount = settings?.paynow_pass_fees === false ? '40.00' : '41.50';
      const created = await db.from('payments').insert({ client_id: client.id, amount, paynow_reference: reference, status: 'pending' }).select('id').single();
      if (created.error) return json({ error: 'Could not create payment record' }, 500);
      const currentSubscriptionIsActive = client.subscription_status === 'active'
        && client.subscription_ends_at
        && Date.parse(client.subscription_ends_at) > Date.now();
      if (!currentSubscriptionIsActive) await db.from('veylo_clients').update({ subscription_status: 'pending' }).eq('id', client.id);
      const fields: Record<string, string> = {
        id: integrationId,
        reference,
        amount,
        additionalinfo: 'Veylo WhatsApp monthly subscription',
        returnurl: new URL('/settings/veylo-billing?payment=returned', siteUrl).toString(),
        resulturl: new URL('/api/veylo/billing/paynow-callback', siteUrl).toString(),
        status: 'Message',
      };
      const values = Object.values(fields);
      const form = new URLSearchParams(fields);
      form.set('hash', paynowHash(values, integrationKey));
      const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString(),
        signal: AbortSignal.timeout(20_000),
      }).catch(() => null);
      if (!response?.ok) {
        await db.from('payments').update({ status: 'failed' }).eq('id', created.data.id);
        return json({ error: 'Could not reach Paynow' }, 502);
      }
      const responseParams = parsePaynowResponse(await response.text());
      if (!validatePaynowMessage(responseParams, integrationKey) || responseParams.get('status')?.toLowerCase() !== 'ok') {
        await db.from('payments').update({ status: 'failed' }).eq('id', created.data.id);
        return json({ error: 'Paynow rejected the payment request' }, 502);
      }
      const redirectUrl = responseParams.get('browserurl');
      const pollUrl = responseParams.get('pollurl');
      if (!redirectUrl || !pollUrl || !redirectUrl.startsWith('https://')) {
        await db.from('payments').update({ status: 'failed' }).eq('id', created.data.id);
        return json({ error: 'Paynow returned an invalid payment URL' }, 502);
      }
      await db.from('payments').update({ poll_url: pollUrl }).eq('id', created.data.id);
      return json({ ok: true, redirectUrl, amount });
    },
  } },
});
