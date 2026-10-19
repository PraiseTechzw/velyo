import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Building2,
  CircleHelp,
  CreditCard,
  Plug,
  Settings2,
  ShieldCheck,
  Users,
  BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsBusinessProfile } from "@/components/settings-business-profile";
import { PageTitle } from "@/components/dashboard-pages";
import { getBusiness, updateNotificationPreference } from "@/lib/business.functions";

const businessQuery = { queryKey: ["business"], queryFn: () => getBusiness() };
const settingsLinks = [
  { id: "profile", label: "Business profile", icon: Building2 },
  { id: "whatsapp", label: "WhatsApp Integration", icon: WhatsAppIcon },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "team", label: "Team & Permissions", icon: Users },
  { id: "automations", label: "Automations", icon: Settings2 },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
  { id: "security", label: "Security & Privacy", icon: ShieldCheck },
  { id: "integrations", label: "Integrations & API", icon: Plug },
  { id: "help", label: "Help & Support", icon: CircleHelp },
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
  const saveNotification = useServerFn(updateNotificationPreference);
  const notificationMutation = useMutation({
    mutationFn: (enabled: boolean) => saveNotification({ data: { enabled } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business"] }),
  });
  const [notificationError, setNotificationError] = useState("");
  const [activeSection, setActiveSection] = useState("profile");
  const business = data.business;

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sections = settingsLinks
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-12% 0px -72% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  if (!business) return null;

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
        detail="Manage your workspace, WhatsApp connection, AI assistant and business preferences."
        sample={false}
      />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-[740px] h-fit rounded-2xl border bg-background p-2 shadow-sm lg:sticky lg:top-2">
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
          >
            {settingsLinks.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              const className = `relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? "bg-brand-soft font-medium text-brand before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-full before:bg-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`;
              if (id === "whatsapp") return (
                <Link key={id} to="/settings/whatsapp" className={className} activeProps={{ className: `${className} bg-brand-soft font-medium text-brand` }}>
                  <Icon className="h-4 w-4 text-[#25D366]" />{label}
                </Link>
              );
              return (
                <a key={id} href={`#${id}`} aria-current={active ? "location" : undefined} onClick={() => setActiveSection(id)} className={className}>
                  <Icon className="h-4 w-4" />{label}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="space-y-5">
            <section id="profile" className="scroll-mt-4">
              <SettingsBusinessProfile business={business} profile={data.profile} />
            </section>

            <section
              id="assistant"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-semibold">AI assistant</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Knowledge and response behaviour configured for this business.
              </p>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <SettingValue label="Supported language" value={business.language} />
                <SettingValue
                  label="Products and prices"
                  value={business.products ? "Configured" : "Not added yet"}
                />
                <SettingValue
                  label="Common questions"
                  value={business.faqs ? "Configured" : "Not added yet"}
                />
                <SettingValue
                  label="Delivery and payment"
                  value={business.delivery_policy ? "Policy added" : "Not added yet"}
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

            <section
              id="team"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
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
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
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
                  label="Delivery and payment policy"
                  value={business.delivery_policy ? "Configured" : "Not configured"}
                />
              </dl>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/account">Edit business hours</Link>
              </Button>
              <NotReady>
                Follow-ups, reminders, order updates, automation pause controls, and workflow
                safeguards are not connected to persisted automation rules. The previous
                preview-only switches have been removed.
              </NotReady>
            </section>

            <section
              id="notifications"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Email notification preference saved for this workspace.
                  </p>
                </div>
                <Switch
                  aria-label="Enable email notifications"
                  checked={business.notifications}
                  disabled={notificationMutation.isPending}
                  onCheckedChange={toggleNotifications}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {business.notifications
                  ? "Email notifications are enabled."
                  : "Email notifications are disabled."}{" "}
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

            <section
              id="billing"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-semibold">Plan and billing</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Subscription and usage information.
              </p>
              <NotReady>
                No subscription, invoice, payment method, or billing usage records are connected to
                this workspace yet.
              </NotReady>
            </section>

            <section
              id="security"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
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
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
              <h2 className="text-lg font-semibold">Integrations and API</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connected services for this workspace.
              </p>
              <Button asChild variant="outline" className="mt-5"><Link to="/settings/whatsapp">Open WhatsApp integration</Link></Button>
              <NotReady>
                There is no customer-facing API key manager or additional integration registry yet.
                WhatsApp access tokens are stored encrypted on the server and cannot be viewed after
                saving.
              </NotReady>
            </section>

            <section
              id="help"
              className="scroll-mt-4 rounded-2xl border bg-background p-5 shadow-sm md:p-6"
            >
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
