import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, LoaderCircle, MessageCircle, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

type Config = { client: null | { waba_id: string; phone_number_id: string; display_number: string; status: string }; webhookUrl: string; verifyToken: string; metaAppId: string };
type Billing = { subscriptionStatus: string; subscriptionEndsAt: string | null; passFees: boolean; latestPayment: null | { amount: number; status: string; created_at: string } };

async function api(path: string, method = 'GET', body?: unknown) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Your session has expired. Sign in again.');
  const response = await fetch(path, {
    method,
    headers: { authorization: `Bearer ${data.session.access_token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Request failed');
  return result;
}

function AddonNav({ current }: { current: 'whatsapp' | 'billing' }) {
  return <nav aria-label="Veylo add-on settings" className="mb-5 flex gap-2 border-b border-[#e7edf2] pb-3">
    <a href="/settings/veylo-whatsapp" className={`rounded-full px-4 py-2 text-sm ${current === 'whatsapp' ? 'bg-[#e8f7f0] font-semibold text-[#00864c]' : 'text-[#61758b] hover:bg-[#f2f6f8]'}`}>WhatsApp</a>
    <a href="/settings/veylo-billing" className={`rounded-full px-4 py-2 text-sm ${current === 'billing' ? 'bg-[#e8f7f0] font-semibold text-[#00864c]' : 'text-[#61758b] hover:bg-[#f2f6f8]'}`}>Billing</a>
  </nav>;
}

export function VeyloWhatsAppSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState({ waba_id: '', phone_number_id: '', display_number: '', access_token: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    void api('/api/veylo/settings/whatsapp').then((data: Config) => {
      setConfig(data);
      if (data.client) setForm((value) => ({ ...value, waba_id: data.client!.waba_id, phone_number_id: data.client!.phone_number_id, display_number: data.client!.display_number }));
    }).catch((e) => setError(e.message));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await api('/api/veylo/settings/whatsapp', 'POST', form);
      setForm((value) => ({ ...value, access_token: '' }));
      setConfig(await api('/api/veylo/settings/whatsapp'));
      setNotice('WhatsApp connection saved. Your access token was encrypted on the server.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save connection'); }
    finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setError(''); setNotice('');
    try { await api('/api/veylo/whatsapp/test', 'POST', {}); setNotice('Test template message accepted by Meta.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Test message failed'); }
    finally { setBusy(false); }
  }
  async function copy(text: string) { await navigator.clipboard.writeText(text).catch(() => setError('Clipboard access is unavailable.')); }

  return <div className="space-y-5">
    <AddonNav current="whatsapp" />
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold tracking-tight text-[#18324b]">Veylo WhatsApp Integration</h1><p className="mt-1 text-sm text-[#7890aa]">Connect your WhatsApp Business number for the Veylo subscription service.</p></div>
      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${config?.client?.status === 'active' ? 'bg-[#e8f7f0] text-[#00864c]' : 'bg-slate-100 text-slate-600'}`}>{config?.client?.status === 'active' ? 'Connected' : 'Not connected'}</span>
    </div>
    <Card className="border-[#e4eaf0] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#18324b]"><MessageCircle className="h-5 w-5 text-[#009b59]" /> WhatsApp Business details</CardTitle><CardDescription>Credentials are encrypted before storage and are never returned to this page.</CardDescription></CardHeader>
      <CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="waba">WABA ID</Label><Input id="waba" required value={form.waba_id} onChange={(e) => setForm({ ...form, waba_id: e.target.value })} placeholder="1290399379879283" /></div>
        <div className="space-y-2"><Label htmlFor="phone-id">Phone Number ID</Label><Input id="phone-id" required value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} placeholder="1291977560675398" /></div>
        <div className="space-y-2"><Label htmlFor="display-number">Display Number</Label><Input id="display-number" required value={form.display_number} onChange={(e) => setForm({ ...form, display_number: e.target.value })} placeholder="+263 77 123 4567" /></div>
        <div className="space-y-2"><Label htmlFor="access-token">Access Token</Label><Input id="access-token" type="password" autoComplete="new-password" required value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} /></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="webhook">Webhook URL</Label><div className="flex gap-2"><Input id="webhook" readOnly value={config?.webhookUrl ?? ''} /><Button type="button" variant="outline" onClick={() => void copy(config?.webhookUrl ?? '')}><Copy className="mr-2 h-4 w-4" />Copy</Button></div></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="verify-token">Verify Token</Label><div className="flex gap-2"><Input id="verify-token" readOnly type="password" value={config?.verifyToken ?? ''} /><Button type="button" variant="outline" onClick={() => void copy(config?.verifyToken ?? '')}><Copy className="mr-2 h-4 w-4" />Copy</Button></div><p className="text-xs text-[#8298b3]">Enter this token with the webhook URL in Meta’s webhook configuration.</p></div>
        {config?.metaAppId && <p className="text-xs text-[#8298b3] md:col-span-2">Shared Meta App ID: {config.metaAppId}</p>}
        {error && <p role="alert" className="text-sm text-red-600 md:col-span-2">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700 md:col-span-2">{notice}</p>}
        <div className="flex flex-wrap gap-2 md:col-span-2"><Button disabled={busy} type="submit" className="bg-[#00a65a] hover:bg-[#008e4d]">{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Save & Encrypt</Button><Button disabled={busy || config?.client?.status !== 'active'} type="button" variant="outline" onClick={() => void test()}>Send Test Message</Button></div>
      </form></CardContent>
    </Card>
    {config?.client && <Card className="border-[#e4eaf0]"><CardContent className="flex items-center gap-3 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="font-medium text-[#18324b]">Connection active</p><p className="text-sm text-[#7890aa]">Phone number ID: {config.client.phone_number_id}</p></div></CardContent></Card>}
  </div>;
}

export function VeyloBillingSettingsPage() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { void api('/api/veylo/billing/pay').then(setBilling).catch((e) => setError(e.message)); }, []);

  async function changeFeePolicy(passFees: boolean) {
    setError(''); setNotice('');
    try { await api('/api/veylo/billing/settings', 'POST', { paynow_pass_fees: passFees }); setBilling((value) => value ? { ...value, passFees } : value); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save preference'); }
  }
  async function pay() {
    setBusy(true); setError('');
    try { const result = await api('/api/veylo/billing/pay', 'POST', {}); window.location.assign(result.redirectUrl); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not start Paynow checkout'); setBusy(false); }
  }

  return <div className="space-y-5">
    <AddonNav current="billing" />
    <div><h1 className="text-2xl font-bold tracking-tight text-[#18324b]">Veylo Billing</h1><p className="mt-1 text-sm text-[#7890aa]">Your Veylo WhatsApp subscription is paid to Veylo through Paynow.</p></div>
    <Card className="border-[#e4eaf0] shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-[#18324b]"><WalletCards className="h-5 w-5 text-[#009b59]" /> Monthly subscription</CardTitle><CardDescription>$40 per month. Veylo covers WhatsApp platform costs from the subscription.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-[#e7edf2] p-4"><div><p className="font-medium text-[#18324b]">Pass Paynow fees to me</p><p className="mt-1 text-sm text-[#7890aa]">When enabled, checkout charges $41.50 instead of $40.00.</p></div><Switch checked={billing?.passFees ?? true} onCheckedChange={(checked) => void changeFeePolicy(checked)} aria-label="Pass Paynow fees to customer" /></div>
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-[#7890aa]">Subscription status</p><p className="mt-1 font-semibold capitalize text-[#18324b]">{billing?.subscriptionStatus?.replace('_', ' ') ?? 'Loading'}</p>{billing?.subscriptionEndsAt && billing.subscriptionStatus === 'active' && <p className="mt-1 text-xs text-[#8298b3]">Next renewal: {new Date(billing.subscriptionEndsAt).toLocaleDateString()}</p>}{billing?.latestPayment && <p className="mt-1 text-xs text-[#8298b3]">Last payment: ${Number(billing.latestPayment.amount).toFixed(2)} · {billing.latestPayment.status}</p>}</div><Button disabled={busy || !billing} onClick={() => void pay()} className="bg-[#00a65a] hover:bg-[#008e4d]">{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}Pay ${billing?.passFees === false ? '40.00' : '41.50'} with Paynow<ArrowUpRight className="ml-2 h-4 w-4" /></Button></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      </CardContent>
    </Card>
  </div>;
}
