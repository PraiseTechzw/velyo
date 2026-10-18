import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Building2,
  CircleHelp,
  CreditCard,
  Plug,
  Radio,
  Settings2,
  ShieldCheck,
  Users,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/dashboard-pages";
import { getBusiness, updateNotificationPreference } from "@/lib/business.functions";
import { connectWhatsApp, getWhatsAppConnection } from "@/lib/whatsapp.functions";

const businessQuery = { queryKey: ["business"], queryFn: () => getBusiness() };
const settingsLinks = [
  { id: "profile", label: "Business profile", icon: Building2 },
  { id: "whatsapp", label: "WhatsApp", icon: Radio },
  { id: "assistant", label: "AI assistant", icon: Bot },
  { id: "team", label: "Team", icon: Users },
  { id: "automations", label: "Automations", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "integrations", label: "Integrations & API", icon: Plug },
  { id: "help", label: "Help & support", icon: CircleHelp },
];

function NotReady({ children }: { children: string }) {
  return (
    <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
      {children}
    </p>
  );
}

export function SettingsPage() {
  const { data } = useSuspenseQuery(businessQuery);
  const queryClient = useQueryClient();
  const connection = useQuery({
    queryKey: ["whatsapp-connection"],
    queryFn: () => getWhatsAppConnection(),
  });
  const connect = useServerFn(connectWhatsApp);
  const saveNotification = useServerFn(updateNotificationPreference);
  const notificationMutation = useMutation({
    mutationFn: (enabled: boolean) => saveNotification({ data: { enabled } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business"] }),
  });
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const business = data.business;
  if (!business) return null;
  const status = connection.data?.status ?? "not connected";

  async function submitConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConnectionError("");
    setConnecting(true);
    try {
      await connect({ data: { phoneNumberId, businessAccountId, accessToken } });
      setAccessToken("");
      setPhoneNumberId("");
      setBusinessAccountId("");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] });
    } catch (cause) {
      setConnectionError(
        cause instanceof Error ? cause.message : "WhatsApp could not be connected.",
      );
    } finally {
      setConnecting(false);
    }
  }

  async function toggleNotifications(enabled: boolean) {
    setNotificationError("");
    try {
      await notificationMutation.mutateAsync(enabled);
    } catch {
      setNotificationError("Notification preference could not be saved. Please try again.");
    }
  }

  return (
    <>
      <PageTitle
        title="Settings"
        detail="Manage your workspace and configure how your business operates."
        sample={false}
      />
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-xl border bg-background p-2 lg:sticky lg:top-2">
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
          >
            {settingsLinks.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <section id="profile" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Business profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Identity and business information for your workspace.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/account">Edit business profile</Link>
              </Button>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <SettingValue label="Business name" value={business.name} />
              <SettingValue label="Industry" value={business.industry || "Not set"} />
              <SettingValue
                label="Country and time zone"
                value={`${business.country} · ${business.timezone}`}
              />
              <SettingValue
                label="Contact details"
                value={
                  [business.contact_email, business.contact_phone].filter(Boolean).join(" · ") ||
                  "Not set"
                }
              />
              <SettingValue label="Website" value={business.website || "Not set"} />
              <SettingValue label="Currency" value={business.currency} />
              <SettingValue label="Operating hours" value={business.operating_hours || "Not set"} />
              <SettingValue label="Business logo" value="Not configured" />
            </dl>
          </section>

          <section id="whatsapp" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">WhatsApp integration</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Official Meta WhatsApp Business Cloud API.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs capitalize ${status === "connected" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}`}
              >
                {connection.isPending
                  ? "Checking…"
                  : connection.isError
                    ? "Status unavailable"
                    : status}
              </span>
            </div>
            {connection.data?.display_phone_number && (
              <p className="mt-4 text-sm">Phone number: {connection.data.display_phone_number}</p>
            )}
            {connection.data?.business_account_id && (
              <p className="mt-1 text-sm text-muted-foreground">
                Business account: {connection.data.business_account_id}
              </p>
            )}
            {connection.data?.last_error && (
              <p className="mt-3 rounded-md border border-destructive/30 p-3 text-sm text-destructive">
                {connection.data.last_error}
              </p>
            )}
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              {connection.isError
                ? "Connection details could not be checked. Retry loading this page or review the server configuration."
                : status === "connected"
                  ? "A signed webhook event has been verified. The integration is connected."
                  : status === "pending"
                    ? "Meta validated the phone and webhook subscription. Waiting for the first signed event; confirm the public callback URL and subscribe to the messages field in your Meta app."
                    : "Connect a Meta app with a registered WhatsApp Business phone number and an access token with WhatsApp permissions. The token is encrypted on the server and is never displayed again."}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Webhook health:{" "}
              {connection.data?.verified_at
                ? `Last verified ${new Date(connection.data.verified_at).toLocaleString()}`
                : status === "connected"
                  ? "Verification timestamp unavailable"
                  : "No verified webhook event yet"}
            </p>
            <details className="mt-5 rounded-lg border bg-background p-4">
              <summary className="cursor-pointer font-medium">
                {status === "connected" || status === "pending"
                  ? "Update connection"
                  : "Connect WhatsApp"}
              </summary>
              <form onSubmit={submitConnection} className="mt-4 max-w-2xl space-y-4">
                <div>
                  <label htmlFor="wa-phone-id" className="mb-2 block text-sm font-medium">
                    Phone Number ID
                  </label>
                  <Input
                    id="wa-phone-id"
                    required
                    maxLength={100}
                    autoComplete="off"
                    value={phoneNumberId}
                    onChange={(event) => setPhoneNumberId(event.target.value)}
                    placeholder="From Meta WhatsApp API setup"
                  />
                </div>
                <div>
                  <label htmlFor="wa-business-id" className="mb-2 block text-sm font-medium">
                    WhatsApp Business Account ID
                  </label>
                  <Input
                    id="wa-business-id"
                    required
                    maxLength={100}
                    autoComplete="off"
                    value={businessAccountId}
                    onChange={(event) => setBusinessAccountId(event.target.value)}
                    placeholder="From Meta Business Manager"
                  />
                </div>
                <div>
                  <label htmlFor="wa-access-token" className="mb-2 block text-sm font-medium">
                    System-user access token
                  </label>
                  <Input
                    id="wa-access-token"
                    required
                    type="password"
                    autoComplete="new-password"
                    maxLength={5000}
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                  />
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  The token is sent to the server over HTTPS, encrypted before storage, and never
                  displayed again. It is not written to browser storage or application logs.
                </p>
                {connectionError && (
                  <p role="alert" className="text-sm text-destructive">
                    {connectionError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={connecting || !phoneNumberId || !businessAccountId || !accessToken}
                >
                  {connecting ? "Verifying with Meta…" : "Verify and connect"}
                </Button>
              </form>
            </details>
            <NotReady>
              Message template management and fine-grained Meta permission diagnostics are not yet
              available in this workspace.
            </NotReady>
          </section>

          <section
            id="assistant"
            className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold">AI assistant</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Knowledge and response behaviour configured for this business.
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <SettingValue label="Supported language" value={business.language} />
              <SettingValue
                label="Business knowledge"
                value={
                  business.products || business.faqs
                    ? "Business information added"
                    : "No product or FAQ knowledge added"
                }
              />
              <SettingValue
                label="Response instructions"
                value={
                  business.ai_instructions
                    ? "Custom instructions configured"
                    : "Default instructions"
                }
              />
              <SettingValue
                label="Escalation and fallback rules"
                value="Not separately configurable yet"
              />
            </dl>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/account">Edit business knowledge</Link>
            </Button>
            <NotReady>
              Assistant name, tone presets, fallback messages, escalation conditions, and AI usage
              limits do not have dedicated settings or persisted fields yet.
            </NotReady>
          </section>

          <section id="team" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <h2 className="text-lg font-semibold">Team and permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Workspace role and access.</p>
            <p className="mt-4 text-sm">
              Your role:{" "}
              <span className="font-medium">
                {data.roles.find((role) => role.business_id === business.id)?.role ??
                  "Role unavailable"}
              </span>
            </p>
            <NotReady>
              Invitations, member lists, inbox permissions, and member removal are not available
              yet. No team member controls are shown until those workflows are implemented.
            </NotReady>
          </section>

          <section
            id="automations"
            className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold">Automations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current business settings used by future workflows.
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <SettingValue
                label="Business hours"
                value={business.operating_hours || "Not configured"}
              />
              <SettingValue
                label="WhatsApp connection"
                value={connection.isPending ? "Checking…" : status}
              />
            </dl>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/account">Edit business hours</Link>
            </Button>
            <NotReady>
              Follow-ups, reminders, order updates, automation pause controls, and workflow
              safeguards are not connected to persisted automation rules. The previous preview-only
              switches have been removed.
            </NotReady>
          </section>

          <section
            id="notifications"
            className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Workspace-wide notification preference.
                </p>
              </div>
              <Switch
                aria-label="Enable workspace notifications"
                checked={business.notifications}
                disabled={notificationMutation.isPending}
                onCheckedChange={toggleNotifications}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {business.notifications
                ? "Workspace notifications are enabled."
                : "Workspace notifications are disabled."}{" "}
              The current setting is stored with your business profile.
            </p>
            {notificationError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {notificationError}
              </p>
            )}
            <NotReady>
              Per-event alerts, assigned conversation notifications, failed automation alerts, and
              email delivery preferences are not separately configurable yet.
            </NotReady>
          </section>

          <section id="billing" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <h2 className="text-lg font-semibold">Plan and billing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscription and usage information.
            </p>
            <NotReady>
              No subscription, invoice, payment method, or billing usage records are connected to
              this workspace yet.
            </NotReady>
          </section>

          <section id="security" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <h2 className="text-lg font-semibold">Security and privacy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign-in is managed through Supabase Auth. Business integration credentials remain
              server-side and are not exposed here.
            </p>
            <NotReady>
              Session management, two-factor enrollment, audit history, data export, and account
              deletion controls are not implemented yet.
            </NotReady>
          </section>

          <section
            id="integrations"
            className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6"
          >
            <h2 className="text-lg font-semibold">Integrations and API</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connected services for this workspace.
            </p>
            <dl className="mt-5">
              <SettingValue
                label="WhatsApp Cloud API"
                value={
                  connection.isPending
                    ? "Checking status…"
                    : connection.isError
                      ? "Status unavailable"
                      : status
                }
              />
            </dl>
            <NotReady>
              There is no customer-facing API key manager or additional integration registry yet.
              WhatsApp access tokens are stored encrypted on the server and cannot be viewed after
              saving.
            </NotReady>
          </section>

          <section id="help" className="scroll-mt-4 rounded-xl border bg-background p-5 md:p-6">
            <h2 className="text-lg font-semibold">Help and support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Get guidance for setting up your business workspace.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/help">Open help and support</Link>
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}

function SettingValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
