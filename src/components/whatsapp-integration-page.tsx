import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Lightbulb,
  Link2,
  LockKeyhole,
  MessageSquare,
  Phone,
  Send,
  ShoppingCart,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { WhatsAppEmbeddedSignup } from "@/components/whatsapp-embedded-signup";
import { getBusiness } from "@/lib/business.functions";
import { getDashboardMetrics } from "@/lib/dashboard.functions";
import {
  connectWhatsApp,
  getWhatsAppConnection,
  getWhatsAppSignupConfig,
} from "@/lib/whatsapp.functions";

const businessQuery = { queryKey: ["business"], queryFn: () => getBusiness() };
const connectionQuery = {
  queryKey: ["whatsapp-connection"],
  queryFn: () => getWhatsAppConnection(),
};
const metricsQuery = { queryKey: ["dashboard-metrics"], queryFn: () => getDashboardMetrics() };
const configQuery = {
  queryKey: ["whatsapp-embedded-signup-config"],
  queryFn: () => getWhatsAppSignupConfig(),
};

export function WhatsAppIntegrationPage() {
  const { data } = useSuspenseQuery(businessQuery);
  const queryClient = useQueryClient();
  const connection = useQuery(connectionQuery);
  const metrics = useQuery(metricsQuery);
  const config = useQuery(configQuery);
  const connect = useServerFn(connectWhatsApp);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("/api/whatsapp/webhook");
  const [copied, setCopied] = useState("");
  const business = data.business;
  const integration = connection.data;
  const status = integration?.status ?? "not connected";
  const connected = status === "connected";

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/whatsapp/webhook`);
  }, []);

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setConnectionError("Clipboard access is unavailable in this browser.");
    }
  }

  async function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectionError("");
    setConnecting(true);
    try {
      await connect({ data: { phoneNumberId, businessAccountId, accessToken } });
      setAccessToken("");
      setPhoneNumberId("");
      setBusinessAccountId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] }),
        queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] }),
      ]);
    } catch (cause) {
      setConnectionError(
        cause instanceof Error ? cause.message : "WhatsApp could not be connected.",
      );
    } finally {
      setConnecting(false);
    }
  }

  if (!business) return null;

  return (
    <div className="space-y-5 pb-5">
      <header className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex min-w-0 items-start gap-4">
          <WhatsAppIcon className="mt-1 h-10 w-10 shrink-0 text-[#009b59]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#102b45]">
              WhatsApp Integration
            </h1>
            <p className="mt-1 text-sm text-[#7188a5]">
              Connect your WhatsApp Business account to start receiving and managing customer
              conversations.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${connected ? "bg-[#e4f7ee] text-[#008f4c]" : "bg-muted text-muted-foreground"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#00a553]" : "bg-muted-foreground"}`}
            />
            {connection.isPending
              ? "Checking…"
              : connection.isError
                ? "Unavailable"
                : connected
                  ? "Connected"
                  : status}
          </span>
          <p className="mt-1.5 text-[11px] text-[#7188a5]">
            {integration?.verified_at
              ? `Last synced: ${formatLocalDate(integration.verified_at)}`
              : "No verified webhook sync yet"}
          </p>
        </div>
      </header>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(290px,0.82fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          <section className="overflow-hidden rounded-2xl border border-[#e4ebf0] bg-white p-3 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
            <div className="rounded-xl border-l-2 border-[#19b77a] bg-gradient-to-r from-[#eefaf4] to-[#f7fcf9] p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#00a65a] text-white shadow-sm">
                  <WhatsAppIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#102b45]">WhatsApp Business</p>
                  <p
                    className={`mt-1 text-sm font-semibold ${connected ? "text-[#009b59]" : "text-amber-700"}`}
                  >
                    {connection.isPending
                      ? "Checking connection…"
                      : connected
                        ? "Connected"
                        : status === "pending"
                          ? "Setup pending"
                          : "Not connected"}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-[#7188a5]">
                    {connected
                      ? "Your business number is active and ready to use."
                      : "Connect a number to receive WhatsApp conversations."}
                  </p>
                </div>
              </div>
            </div>
            <dl className="divide-y divide-[#eef1f4] px-2 pt-2 text-xs">
              <ConnectionRow
                label="Phone number"
                value={integration?.display_phone_number || "Not connected"}
                copyValue={integration?.display_phone_number || undefined}
                onCopy={() => copy("phone", integration?.display_phone_number || "")}
                copied={copied === "phone"}
              />
              <ConnectionRow
                label="Business Account ID"
                value={integration?.business_account_id || "—"}
                copyValue={integration?.business_account_id || undefined}
                onCopy={() => copy("account", integration?.business_account_id || "")}
                copied={copied === "account"}
              />
              <ConnectionRow
                label="App ID"
                value={config.data?.appId || "Not configured"}
                copyValue={config.data?.appId || undefined}
                onCopy={() => copy("app", config.data?.appId || "")}
                copied={copied === "app"}
              />
              <ConnectionRow
                label="Webhook status"
                value={
                  connected ? "Active" : status === "pending" ? "Awaiting first event" : "Inactive"
                }
                active={connected}
              />
              <ConnectionRow label="Connection type" value={connected ? "Meta Cloud API" : "—"} />
              <ConnectionRow
                label="Created"
                value={integration?.created_at ? formatLocalDate(integration.created_at) : "—"}
              />
            </dl>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                disabled
                title="Disconnect is not available yet"
                className="h-9 border-[#dbe4ed] text-xs text-[#294766]"
              >
                <Link2 className="h-3.5 w-3.5" />
                Disconnect
              </Button>
              <Button
                asChild
                className={`h-9 bg-[#00a760] text-xs text-white hover:bg-[#009451] ${connected ? "" : "pointer-events-none opacity-50"}`}
              >
                <a
                  href={`https://business.facebook.com/latest/whatsapp_manager/phone_numbers/${integration?.business_account_id ? `?business_id=${encodeURIComponent(integration.business_account_id)}` : ""}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!connected}
                  tabIndex={connected ? 0 : -1}
                >
                  View on Meta <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
            {integration?.last_error && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {integration.last_error}
              </p>
            )}
            {connectionError && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {connectionError}
              </p>
            )}
            <details className="mt-3 rounded-lg border border-[#e4ebf0] px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-[#36516f]">
                Advanced manual setup
              </summary>
              <form onSubmit={submitConnection} className="mt-3 space-y-3">
                <p className="text-[11px] leading-4 text-muted-foreground">
                  For developer testing or assisted setup. Credentials are encrypted on the server.
                </p>
                <Input
                  required
                  maxLength={100}
                  autoComplete="off"
                  value={phoneNumberId}
                  onChange={(event) => setPhoneNumberId(event.target.value)}
                  placeholder="Meta Phone Number ID"
                  aria-label="Meta Phone Number ID"
                />
                <Input
                  required
                  maxLength={100}
                  autoComplete="off"
                  value={businessAccountId}
                  onChange={(event) => setBusinessAccountId(event.target.value)}
                  placeholder="WhatsApp Business Account ID"
                  aria-label="WhatsApp Business Account ID"
                />
                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  maxLength={5000}
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                  placeholder="Meta system-user access token"
                  aria-label="Meta system-user access token"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={connecting || !phoneNumberId || !businessAccountId || !accessToken}
                  className="w-full"
                >
                  {connecting ? "Verifying with Meta…" : "Verify and connect"}
                </Button>
              </form>
            </details>
          </section>

          <section className="rounded-2xl border border-[#e4ebf0] bg-white p-5 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#102b45]">
              Message activity <Info className="h-3.5 w-3.5 text-[#7188a5]" />
            </h2>
            <div className="mt-4 flex items-center gap-5">
              <div className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-full border-[7px] border-[#c9efdf] bg-white">
                <div className="text-center">
                  <p className="text-xl font-semibold text-[#173a5b]">
                    {metrics.data?.messagesThisMonth?.toLocaleString() ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#7188a5]">this month</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#7188a5]">Messages this month</p>
                <p className="mt-1 text-sm font-semibold text-[#173a5b]">
                  {metrics.data?.messagesThisMonth?.toLocaleString() ?? "Loading usage…"}
                </p>
                <p className="mt-2 text-[10px] text-[#7188a5]">
                  No monthly message limit is configured.
                </p>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-[#7188a5]">
              <MessageSquare className="h-3.5 w-3.5" />
              Usage updates as messages are recorded.
            </p>
          </section>
        </div>

        <div className="space-y-3">
          <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#102b45]">
                  WhatsApp Business Information
                </h2>
                <p className="mt-1 text-[11px] text-[#7188a5]">
                  Business profile details saved in Veylo.
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 border-[#dbe4ed] text-[11px]"
              >
                <Link to="/settings/">Edit profile</Link>
              </Button>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <div className="flex min-h-[178px] items-start gap-5 rounded-xl border border-[#e8edf1] p-4">
                <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-2xl bg-[#dcf7eb] text-[#06a65f]">
                  <LockKeyhole className="h-10 w-10" />
                </div>
                <dl className="grid min-w-0 gap-4 text-xs">
                  <Value label="Business name" value={business.name} />
                  <Value label="Category" value={business.industry || "Not set"} />
                  <Value label="Description" value={business.description || "Not set"} />
                </dl>
              </div>
              <div className="flex min-h-[178px] items-center justify-center rounded-xl border border-[#e8edf1] bg-[#faf9f6] p-3">
                <div className="w-full max-w-[280px] rounded-2xl bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#00a65a] text-white">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#102b45]">{business.name}</p>
                  <p className="text-[10px] text-[#7188a5]">Profile preview</p>
                  <div className="mt-4 flex justify-center gap-7 text-[#007e57]">
                    <span>
                      <MessageSquare className="mx-auto h-4 w-4" />
                      <small className="text-[9px] text-[#36516f]">Message</small>
                    </span>
                    <span>
                      <Phone className="mx-auto h-4 w-4" />
                      <small className="text-[9px] text-[#36516f]">Call</small>
                    </span>
                    <span>
                      <Send className="mx-auto h-4 w-4" />
                      <small className="text-[9px] text-[#36516f]">Share</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
            <div>
              <h2 className="text-sm font-semibold text-[#102b45]">Webhook & Event Settings</h2>
              <p className="mt-1 text-[11px] text-[#7188a5]">
                Configure how WhatsApp messages and events are handled.
              </p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="rounded-xl bg-[#f4f8f8] p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#009b59]">
                    <Webhook className="h-5 w-5" />
                  </span>
                  <h3 className="text-xs font-semibold text-[#173a5b]">Webhook URL</h3>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#dce6ed] bg-white px-3">
                  <span className="min-w-0 flex-1 truncate py-2 text-[10px] text-[#315b86]">
                    {webhookUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label="Copy webhook URL"
                    onClick={() => copy("webhook", webhookUrl)}
                  >
                    {copied === "webhook" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="Remote webhook tests are not available yet"
                  className="mt-3 h-8 border-[#dbe4ed] text-[10px]"
                >
                  <Webhook className="h-3.5 w-3.5" />
                  Test webhook
                </Button>
              </div>
              <div className="rounded-xl border border-[#e8edf1] p-4">
                <h3 className="text-xs font-semibold text-[#173a5b]">Events handled by Veylo</h3>
                <ul className="mt-3 space-y-2 text-[11px] text-[#36516f]">
                  <EventRow active={connected} label="Incoming messages" />
                  <EventRow active={connected} label="Outgoing message statuses" />
                  <EventRow active={false} label="Business account updates" />
                  <EventRow active={false} label="Phone number updates" />
                </ul>
              </div>
            </div>
            {integration?.last_error && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                Latest webhook error: {integration.last_error}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#102b45]">Message Templates</h2>
                <p className="mt-1 text-[11px] text-[#7188a5]">
                  Approved templates for notifications and automated messages.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Template management is not connected yet"
                className="h-8 border-[#dbe4ed] text-[10px]"
              >
                <FileText className="h-3.5 w-3.5" />
                Manage templates
              </Button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
              <TemplateCard icon={MessageSquare} title="Welcome message" />
              <TemplateCard icon={ShoppingCart} title="Order update" />
              <TemplateCard icon={CalendarDays} title="Appointment reminder" />
              <TemplateCard icon={FileText} title="Custom template" />
            </div>
            <p className="mt-3 text-[10px] text-[#7188a5]">
              Template records and approval statuses are not connected to this workspace yet.
            </p>
          </section>
        </div>
      </div>

      {(!connected || status === "pending") && (
        <div className="xl:ml-[calc(29.05%-0.75rem)]">
          <WhatsAppEmbeddedSignup />
        </div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dcefe5] bg-gradient-to-r from-[#effaf4] to-[#f8fcf9] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dcf7eb] text-[#00a65a]">
            <Lightbulb className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#174838]">
              Need help with WhatsApp integration?
            </p>
            <p className="mt-1 text-[10px] text-[#7188a5]">
              Check our documentation or contact support if you experience any issues.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 border-[#dbe4ed] text-[11px]">
            <Link to="/help">
              View documentation <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 bg-[#00a760] text-[11px] text-white hover:bg-[#009451]"
          >
            <Link to="/help">
              <Bell className="h-3.5 w-3.5" />
              Contact support
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ConnectionRow({
  label,
  value,
  copyValue,
  onCopy,
  copied,
  active,
}: {
  label: string;
  value: string;
  copyValue?: string;
  onCopy?: () => void;
  copied?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 py-2">
      <dt className="text-[#617995]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-right font-medium text-[#173a5b]">
        {active && <span className="h-1.5 w-1.5 rounded-full bg-[#08b95d]" />}
        <span className="truncate">{value}</span>
        {copyValue && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={onCopy}
            className="shrink-0 text-[#36516f]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          </button>
        )}
      </dd>
    </div>
  );
}
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] text-[#7188a5]">{label}</dt>
      <dd className="mt-1 break-words text-xs font-medium text-[#102b45]">{value}</dd>
    </div>
  );
}
function EventRow({ active, label }: { active: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className={`h-3.5 w-3.5 ${active ? "text-[#00a65a]" : "text-[#aab6c2]"}`} />
      {label}
      {!active && <span className="text-[9px] text-[#8797a8]">not configured</span>}
    </li>
  );
}
function TemplateCard({ icon: Icon, title }: { icon: typeof MessageSquare; title: string }) {
  return (
    <div className="flex min-h-14 items-center gap-2 rounded-xl border border-[#e4ebf0] px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-[#087b59]" />
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium text-[#173a5b]">{title}</p>
        <p className="mt-0.5 text-[9px] text-[#7188a5]">Not configured</p>
      </div>
    </div>
  );
}

function formatLocalDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Harare",
  }).format(new Date(value));
}
