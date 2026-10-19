import { createFileRoute } from '@tanstack/react-router';
import { adminDb } from '@/lib/veylo-api.server';
import { parsePaynowResponse, validatePaynowMessage } from '@/lib/veylo-paynow.server';

function isPaynowUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'paynow.co.zw' || url.hostname.endsWith('.paynow.co.zw'));
  } catch { return false; }
}

export const Route = createFileRoute('/api/veylo/billing/paynow-callback')({
  server: { handlers: {
    POST: async ({ request }) => {
      const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
      if (!integrationKey) return new Response('Configuration unavailable', { status: 503 });
      const raw = await request.text();
      if (raw.length > 20_000) return new Response('Payload too large', { status: 413 });
      const params = new URLSearchParams(raw);
      if (!validatePaynowMessage(params, integrationKey)) return new Response('Invalid Paynow signature', { status: 401 });
      const reference = params.get('reference');
      const amount = params.get('amount');
      const pollUrl = params.get('pollurl');
      if (!reference || !amount || !pollUrl || !isPaynowUrl(pollUrl)) return new Response('Invalid callback', { status: 400 });
      const db = adminDb();
      const { data: payment } = await db.from('payments').select('id, client_id, amount, status').eq('paynow_reference', reference).maybeSingle();
      if (!payment || Number(payment.amount).toFixed(2) !== Number(amount).toFixed(2)) return new Response('Payment not found', { status: 404 });
      if (payment.status === 'paid') return new Response('EVENT_RECEIVED', { status: 200 });
      const pollResponse = await fetch(pollUrl, { method: 'POST', signal: AbortSignal.timeout(15_000) }).catch(() => null);
      if (!pollResponse?.ok) return new Response('Could not verify payment status', { status: 502 });
      const verified = parsePaynowResponse(await pollResponse.text());
      if (!validatePaynowMessage(verified, integrationKey)
        || verified.get('reference') !== reference
        || Number(verified.get('amount')).toFixed(2) !== Number(payment.amount).toFixed(2)) {
        return new Response('Paynow status verification failed', { status: 401 });
      }
      const status = verified.get('status')?.toLowerCase();
      if (status === 'paid') {
        await db.from('payments').update({ status: 'paid', paid_at: new Date().toISOString(), poll_url: pollUrl }).eq('id', payment.id);
        const { data: client } = await db.from('veylo_clients').select('subscription_ends_at').eq('id', payment.client_id).maybeSingle();
        const now = Date.now();
        const existingEnd = client?.subscription_ends_at ? Date.parse(client.subscription_ends_at) : 0;
        const nextEnd = new Date(Math.max(now, Number.isFinite(existingEnd) ? existingEnd : 0));
        nextEnd.setMonth(nextEnd.getMonth() + 1);
        await db.from('veylo_clients').update({ subscription_status: 'active', subscription_ends_at: nextEnd.toISOString() }).eq('id', payment.client_id);
      } else if (status === 'cancelled' || status === 'refunded') {
        await db.from('payments').update({ status: 'cancelled', poll_url: pollUrl }).eq('id', payment.id);
      } else {
        await db.from('payments').update({ poll_url: pollUrl }).eq('id', payment.id);
      }
      return new Response('EVENT_RECEIVED', { status: 200 });
    },
  } },
});
