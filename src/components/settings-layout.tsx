import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BellRing,
  Bot,
  Building2,
  CircleHelp,
  CreditCard,
  Plug,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

const settingsLinks = [
  { to: "/settings/", label: "Business Profile", icon: Building2 },
  { to: "/settings/whatsapp", label: "WhatsApp Integration", icon: WhatsAppIcon },
  { to: "/settings/veylo-whatsapp", label: "Veylo WhatsApp", icon: WhatsAppIcon },
  { to: "/settings/assistant", label: "AI Assistant", icon: Bot },
  { to: "/settings/team", label: "Team & Permissions", icon: Users },
  { to: "/settings/automations", label: "Automations", icon: Settings2 },
  { to: "/settings/notifications", label: "Notifications", icon: BellRing },
  { to: "/settings/billing", label: "Plan & Billing", icon: CreditCard },
  { to: "/settings/veylo-billing", label: "Veylo Billing", icon: WalletCards },
  { to: "/settings/security", label: "Security & Privacy", icon: ShieldCheck },
  { to: "/settings/integrations", label: "Integrations & API", icon: Plug },
  { to: "/settings/help", label: "Help & Support", icon: CircleHelp },
] as const;

export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="h-fit min-h-[740px] rounded-2xl border bg-background p-2 shadow-sm lg:sticky lg:top-2">
        <nav
          aria-label="Settings pages"
          className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
        >
          {settingsLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "bg-brand-soft font-medium text-brand before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-full before:bg-brand",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-muted hover:text-foreground",
              }}
              className="relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors"
            >
              <Icon className={`h-4 w-4 ${to === "/settings/whatsapp" || to === "/settings/veylo-whatsapp" ? "text-[#25D366]" : ""}`} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
