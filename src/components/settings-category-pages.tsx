import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  Clock3,
  CreditCard,
  ExternalLink,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Mail,
  PlugZap,
  ShieldCheck,
  Smartphone,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/dashboard-pages";
import { getBusiness, updateNotificationPreference } from "@/lib/business.functions";
import { getWhatsAppConnection } from "@/lib/whatsapp.functions";
import { supabase } from "@/integrations/supabase/client";

const businessQuery = { queryKey: ["business"], queryFn: () => getBusiness() };
const panel =
  "rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_10px_30px_rgba(24,48,71,0.04)] md:p-6";
const ink = "text-[#18324b]";

function SettingsHeading({
  title,
  detail,
  icon: Icon,
  status,
}: {
  title: string;
  detail: string;
  icon: ElementType;
  status?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e8f7f0] text-[#009b59]">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight md:text-[28px] ${ink}`}>{title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#7890aa]">{detail}</p>
        </div>
      </div>
      {status && (
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f7f0] px-3 py-1.5 text-xs font-medium text-[#00864c]">
          <span className="h-2 w-2 rounded-full bg-[#08a65c]" />
          {status}
        </span>
      )}
    </div>
  );
}
function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className={`text-base font-semibold ${ink}`}>{title}</h2>
      {detail && <p className="mt-1 text-sm text-[#8298b3]">{detail}</p>}
    </div>
  );
}
function SettingRow({
  icon: Icon,
  title,
  detail,
  trailing,
}: {
  icon: ElementType;
  title: string;
  detail: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edf1f5] py-4 last:border-0 last:pb-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f3f7fa] text-[#50708f]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${ink}`}>{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#8298b3]">{detail}</p>
      </div>
      {trailing}
    </div>
  );
}
function StatusBadge({ children, good = false }: { children: ReactNode; good?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${good ? "bg-[#e8f7f0] text-[#00864c]" : "bg-[#f2f5f8] text-[#61758b]"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${good ? "bg-[#08a65c]" : "bg-[#93a3b3]"}`} />
      {children}
    </span>
  );
}
function PanelLink({
  to,
  children,
}: {
  to: "/settings/" | "/settings/assistant" | "/settings/whatsapp" | "/help" | "/account";
  children: ReactNode;
}) {
  return (
    <Button asChild variant="outline" className="border-[#dbe4ed] text-[#294766]">
      <Link to={to}>
        {children}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

export function TeamSettingsPage() {
  const { data } = useSuspenseQuery(businessQuery);
  const role = data.business
    ? data.roles.find((item) => item.business_id === data.business?.id)?.role
    : null;
  return (
    <>
      <SettingsHeading
        title="Team & Permissions"
        detail="See who has access to this workspace and what they can manage."
        status="Workspace owner"
        icon={Users}
      />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={panel}>
          <SectionTitle
            title="Workspace members"
            detail="People with access to your business workspace."
          />
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#e7edf2] bg-[#fbfcfd] p-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#d8f3e5] font-semibold text-[#009b59]">
              {(data.profile?.display_name || data.business?.name || "O").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${ink}`}>
                {data.profile?.display_name || "Workspace owner"}
              </p>
              <p className="truncate text-xs text-[#8298b3]">
                {data.profile?.display_name ? "Account owner" : data.business?.contact_email}
              </p>
            </div>
            <StatusBadge good>{role ?? "Owner"}</StatusBadge>
          </div>
          <div className="mt-5 rounded-xl border border-dashed border-[#d9e3eb] px-5 py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f3f7fa] text-[#6b8298]">
              <Users className="h-5 w-5" />
            </span>
            <p className={`mt-3 text-sm font-semibold ${ink}`}>Invite your team</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#8298b3]">
              Invitations and member management are not enabled for this workspace yet.
            </p>
            <Button type="button" disabled className="mt-4 bg-[#dce5eb] text-[#62798c]">
              Invite member
            </Button>
          </div>
        </section>
        <section className={panel}>
          <SectionTitle title="Roles & access" detail="Current permissions for this workspace." />
          <div className="mt-5 overflow-hidden rounded-xl border border-[#e7edf2]">
            <div className="grid grid-cols-[1fr_1fr] bg-[#f7fafb] px-4 py-3 text-xs font-semibold text-[#7890aa]">
              <span>Permission</span>
              <span className="text-right">Owner</span>
            </div>
            {[
              "Business profile",
              "WhatsApp connection",
              "AI assistant settings",
              "Workspace members",
            ].map((item) => (
              <div
                key={item}
                className="grid grid-cols-[1fr_1fr] items-center border-t border-[#edf1f5] px-4 py-3 text-sm"
              >
                <span className={ink}>{item}</span>
                <span className="inline-flex justify-end">
                  <Check className="h-4 w-4 text-[#009b59]" />
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8298b3]">
            Your account is the workspace owner. Role assignment will be available when team
            invitations are enabled.
          </p>
        </section>
      </div>
    </>
  );
}

export function AutomationsSettingsPage() {
  const { data } = useSuspenseQuery(businessQuery);
  const connection = useQuery({
    queryKey: ["whatsapp-connection"],
    queryFn: () => getWhatsAppConnection(),
  });
  const business = data.business;
  if (!business) return null;
  const hoursReady = Boolean(business.operating_hours?.trim());
  const policyReady = Boolean(business.delivery_policy?.trim());
  const whatsappReady = connection.data?.status === "connected";
  const items = [
    {
      name: "Business hours",
      description: "Use your opening hours to set customer expectations.",
      ready: hoursReady,
      state: hoursReady ? business.operating_hours : "Add your operating hours",
      icon: Clock3,
      to: "/settings/" as const,
    },
    {
      name: "Delivery & payment information",
      description: "Keep answers about delivery and payment consistent.",
      ready: policyReady,
      state: policyReady ? "Business policy is configured" : "Add your delivery and payment policy",
      icon: Check,
      to: "/settings/" as const,
    },
    {
      name: "WhatsApp message handling",
      description: "Receive and manage customer conversations.",
      ready: whatsappReady,
      state: connection.isPending
        ? "Checking connection…"
        : whatsappReady
          ? `Connected${connection.data?.display_phone_number ? ` · ${connection.data.display_phone_number}` : ""}`
          : "Connect a WhatsApp Business account",
      icon: Smartphone,
      to: "/settings/whatsapp" as const,
    },
    {
      name: "AI assistant replies",
      description: "Assistant preferences are saved, but automated replies are not active yet.",
      ready: false,
      state: "AI service not connected",
      icon: Bot,
      to: "/settings/assistant" as const,
    },
  ];
  return (
    <>
      <SettingsHeading
        title="Automations"
        detail="Review the business setup that customer workflows depend on."
        status="Workflow status"
        icon={Workflow}
      />
      <section className={panel}>
        <SectionTitle
          title="Workflow readiness"
          detail="These checks reflect saved business settings and live connection status."
        />
        <div className="mt-3 divide-y divide-[#edf1f5]">
          {items.map(({ name, description, ready, state, icon: Icon, to }) => (
            <div key={name} className="flex flex-wrap items-center gap-3 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f3f7fa] text-[#50708f]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className={`text-sm font-medium ${ink}`}>{name}</p>
                <p className="mt-0.5 text-xs text-[#8298b3]">{description}</p>
              </div>
              <StatusBadge good={ready}>{ready ? "Ready" : "Setup needed"}</StatusBadge>
              <Button asChild variant="ghost" size="sm" className="text-[#50708f]">
                <Link to={to}>
                  Configure
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <p className="w-full pl-[52px] text-xs text-[#8298b3] sm:w-auto sm:pl-0 sm:text-right">
                {state}
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-4 rounded-2xl border border-[#dcefe6] bg-[#f1faf5] p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#009b59]">
            <Workflow className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#18324b]">Automated actions are not active</p>
            <p className="mt-1 text-sm leading-6 text-[#7890aa]">
              Follow-ups, reminders, and order updates will appear here once those workflows are
              available. The readiness checks above do not send customer messages.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function NotificationsSettingsPage() {
  const { data } = useSuspenseQuery(businessQuery);
  const queryClient = useQueryClient();
  const save = useServerFn(updateNotificationPreference);
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => save({ data: { enabled } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business"] }),
  });
  const business = data.business;
  if (!business) return null;
  return (
    <>
      <SettingsHeading
        title="Notifications"
        detail="Choose whether this workspace receives email notifications."
        icon={Bell}
      />
      <section className={panel}>
        <SectionTitle
          title="Email notifications"
          detail="Control account update emails for this workspace."
        />
        <div className="mt-5 rounded-xl border border-[#e7edf2] px-4">
          <SettingRow
            icon={Mail}
            title="Workspace email updates"
            detail={
              business.contact_email || "Add a business email in your profile to receive updates."
            }
            trailing={
              <Switch
                aria-label="Enable email notifications"
                checked={business.notifications}
                disabled={mutation.isPending}
                onCheckedChange={(enabled) => mutation.mutate(enabled)}
              />
            }
          />
        </div>
        {mutation.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Notification preference could not be saved. Please try again.
          </p>
        )}
        {mutation.isSuccess && (
          <p role="status" className="mt-3 text-sm text-[#00864c]">
            Email notification preference saved.
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Account and security", "Important sign-in and account changes"],
            ["Workspace updates", "Changes to your business settings"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-xl bg-[#f7fafb] p-4">
              <p className={`text-sm font-medium ${ink}`}>{title}</p>
              <p className="mt-1 text-xs leading-5 text-[#8298b3]">{detail}</p>
              <p className="mt-3 text-[11px] font-medium text-[#8298b3]">
                Uses the workspace email setting above
              </p>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-4 rounded-xl border border-[#e7edf2] bg-white px-5 py-4 text-sm text-[#7890aa]">
        Per-event alerts and delivery preferences are not configurable yet.
      </div>
    </>
  );
}

export function BillingSettingsPage() {
  return (
    <>
      <SettingsHeading
        title="Plan & Billing"
        detail="View subscription and payment settings for your Veylo workspace."
        icon={CreditCard}
      />
      <section className={`${panel} overflow-hidden p-0`}>
        <div className="bg-gradient-to-r from-[#effaf4] to-white p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#009b59]">
                Subscription
              </p>
              <h2 className={`mt-2 text-2xl font-bold ${ink}`}>Billing setup is not connected</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#7890aa]">
                There is no billing provider or subscription record linked to this workspace yet.
              </p>
            </div>
            <StatusBadge>Not configured</StatusBadge>
          </div>
        </div>
        <div className="grid gap-0 border-t border-[#edf1f5] sm:grid-cols-3">
          {[
            ["Current plan", "Unavailable"],
            ["Next payment", "No billing record"],
            ["Payment method", "Not connected"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-b border-[#edf1f5] p-5 last:border-0 sm:border-b-0 sm:border-r sm:last:border-0"
            >
              <p className="text-xs text-[#8298b3]">{label}</p>
              <p className={`mt-2 text-sm font-semibold ${ink}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#edf1f5] p-5 md:p-6">
          <h3 className={`text-sm font-semibold ${ink}`}>Billing history</h3>
          <div className="mt-3 rounded-xl bg-[#f7fafb] px-4 py-7 text-center text-sm text-[#8298b3]">
            Invoices will appear here when billing is enabled.
          </div>
        </div>
      </section>
    </>
  );
}

export function SecuritySettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);
  async function sendPasswordReset() {
    if (!email) return;
    setLoading(true);
    setNotice("");
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice(`Password reset instructions sent to ${email}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password reset email could not be sent.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <SettingsHeading
        title="Security & Privacy"
        detail="Protect account access and review how workspace data is handled."
        status="Protected account"
        icon={ShieldCheck}
      />
      <section className={panel}>
        <SectionTitle
          title="Sign-in security"
          detail="Manage the credentials used to access your Veylo account."
        />
        <div className="mt-4 rounded-xl border border-[#e7edf2] px-4">
          <SettingRow
            icon={Mail}
            title="Account email"
            detail={email ?? "Loading account email…"}
            trailing={<StatusBadge>Account login</StatusBadge>}
          />
          <SettingRow
            icon={KeyRound}
            title="Password"
            detail="Send a secure password reset link to your account email."
            trailing={
              <Button
                variant="outline"
                size="sm"
                disabled={!email || loading}
                onClick={sendPasswordReset}
                className="border-[#dbe4ed] text-[#294766]"
              >
                {loading ? "Sending…" : "Reset password"}
              </Button>
            }
          />
        </div>
        {notice && (
          <p role="status" className="mt-3 text-sm text-[#00864c]">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
      <section className={`${panel} mt-4`}>
        <SectionTitle
          title="Data & privacy"
          detail="Access to workspace records is protected by your signed-in account."
        />
        <div className="mt-3">
          <SettingRow
            icon={LockKeyhole}
            title="Business data access"
            detail="Workspace records are restricted to authorized business members."
            trailing={<StatusBadge good>Enabled</StatusBadge>}
          />
          <SettingRow
            icon={ShieldCheck}
            title="WhatsApp credentials"
            detail="Connection credentials are stored server-side and are not shown after setup."
            trailing={<StatusBadge good>Protected</StatusBadge>}
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-[#8298b3]">
          Session management, two-factor enrollment, audit history, data export, and account
          deletion controls are not available yet.
        </p>
      </section>
    </>
  );
}

export function IntegrationsSettingsPage() {
  const connection = useQuery({
    queryKey: ["whatsapp-connection"],
    queryFn: () => getWhatsAppConnection(),
  });
  const connected = connection.data?.status === "connected";
  const [copied, setCopied] = useState(false);
  async function copyWebhook() {
    await navigator.clipboard.writeText(`${window.location.origin}/api/whatsapp/webhook`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <>
      <SettingsHeading
        title="Integrations & API"
        detail="Manage connected services and the events they deliver to Veylo."
        icon={PlugZap}
      />
      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            title="Connected services"
            detail="Connection details are based on your workspace integration status."
          />
          {connection.isPending ? (
            <StatusBadge>Checking</StatusBadge>
          ) : (
            <StatusBadge good={connected}>
              {connected ? "1 connected" : "No services connected"}
            </StatusBadge>
          )}
        </div>
        <div className="mt-5 rounded-xl border border-[#e7edf2] p-4 md:p-5">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#e8f7f0] text-[#009b59]">
              <Smartphone className="h-6 w-6" />
            </span>
            <div className="min-w-[180px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-sm font-semibold ${ink}`}>WhatsApp Business Platform</h3>
                <StatusBadge good={connected}>
                  {connection.isPending
                    ? "Checking"
                    : connected
                      ? (connection.data?.status ?? "Connected")
                      : "Not connected"}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm text-[#8298b3]">
                {connection.data?.display_phone_number ||
                  "Connect a WhatsApp Business number to receive messages."}
              </p>
              {connection.data?.last_error && (
                <p className="mt-2 text-xs text-amber-700">
                  Latest connection issue: {connection.data.last_error}
                </p>
              )}
            </div>
            <PanelLink to="/settings/whatsapp">Manage connection</PanelLink>
          </div>
        </div>
      </section>
      <section className={`${panel} mt-4`}>
        <SectionTitle
          title="Webhook endpoint"
          detail="Use this endpoint when configuring the Meta WhatsApp webhook callback."
        />
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#f5f8fa] p-4 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all text-xs text-[#294766]">
            /api/whatsapp/webhook
          </code>
          <Button
            variant="outline"
            onClick={copyWebhook}
            className="shrink-0 border-[#dbe4ed] text-[#294766]"
          >
            {copied ? "Copied" : "Copy endpoint"}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#8298b3]">
          The full endpoint includes your deployed domain. Webhook verification and message
          processing are handled server-side.
        </p>
      </section>
      <section className={`${panel} mt-4`}>
        <SectionTitle
          title="API credentials"
          detail="Veylo does not expose workspace secrets in the browser."
        />
        <div className="mt-3">
          <SettingRow
            icon={LockKeyhole}
            title="Access tokens"
            detail="WhatsApp access tokens are encrypted and cannot be viewed after saving."
            trailing={<StatusBadge good>Server-side</StatusBadge>}
          />
          <SettingRow
            icon={PlugZap}
            title="Public API keys"
            detail="A customer API key manager is not available yet."
            trailing={<StatusBadge>Unavailable</StatusBadge>}
          />
        </div>
      </section>
    </>
  );
}

export function HelpSettingsPage() {
  const helpItems = [
    [
      "Set up your business profile",
      "Add your business details, hours, products, FAQs, and delivery policy.",
      "/settings/" as const,
      "Open profile",
    ],
    [
      "Connect WhatsApp Business",
      "Link your Meta business account and check webhook delivery status.",
      "/settings/whatsapp" as const,
      "Open integration",
    ],
    [
      "Configure your AI assistant",
      "Choose the assistant tone, language, fallback, and saved capabilities.",
      "/settings/assistant" as const,
      "Open assistant",
    ],
  ];
  return (
    <>
      <SettingsHeading
        title="Help & Support"
        detail="Find setup guidance for your Veylo workspace."
        icon={LifeBuoy}
      />
      <section className={panel}>
        <SectionTitle
          title="Setup guides"
          detail="Go straight to the settings that help you finish workspace setup."
        />
        <div className="mt-4 divide-y divide-[#edf1f5]">
          {helpItems.map(([title, description, to, label]) => (
            <div key={title} className="flex flex-wrap items-center gap-3 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f3f7fa] text-[#50708f]">
                <ExternalLink className="h-5 w-5" />
              </span>
              <div className="min-w-[180px] flex-1">
                <p className={`text-sm font-medium ${ink}`}>{title}</p>
                <p className="mt-1 text-xs leading-5 text-[#8298b3]">{description}</p>
              </div>
              <PanelLink to={to}>{label}</PanelLink>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className={panel}>
          <SectionTitle title="Help center" detail="Browse answers about using your workspace." />
          <Button asChild variant="outline" className="mt-4 border-[#dbe4ed] text-[#294766]">
            <Link to="/help">
              Browse help center
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
        <section className={panel}>
          <SectionTitle
            title="Account details"
            detail="Review your business contact information."
          />
          <Button asChild variant="outline" className="mt-4 border-[#dbe4ed] text-[#294766]">
            <Link to="/account">
              Open business account
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
