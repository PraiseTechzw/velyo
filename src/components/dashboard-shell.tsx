import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Calendar, ChevronDown, CircleHelp, FileText, Info, Layers, LayoutGrid, LogOut, Mail, Moon, Search, Settings, Sun, Users } from "lucide-react";
import { getBusiness } from "@/lib/business.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import mark from "@/assets/veylo-mark.png";

const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const topNavigation = [
  { name: "Overview", to: "/dashboard" }, { name: "Chats", to: "/chats" },
  { name: "Leads", to: "/leads" }, { name: "Orders", to: "/orders" },
  { name: "Account", to: "/account" }, { name: "Reports", to: "/reports" },
] as const;
export const sideNavigation = [
  { name: "Overview", to: "/dashboard", icon: LayoutGrid }, { name: "Calendar", to: "/calendar", icon: Calendar },
  { name: "Broadcasts", to: "/broadcasts", icon: Mail }, { name: "Reports", to: "/reports", icon: FileText },
  { name: "Leads", to: "/leads", icon: Users }, { name: "Products", to: "/products", icon: Layers },
  { name: "Settings", to: "/settings", icon: Settings },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(options);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(window.localStorage.getItem("veylo-dashboard-theme") === "dark");
  }, []);
  if (!data.business) return null;
  const name = data.profile.display_name || data.business.name;
  function changeTheme(theme: "light" | "dark") {
    window.localStorage.setItem("veylo-dashboard-theme", theme);
    setDark(theme === "dark");
  }
  async function signOut() {
    await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  return <div className={`${dark ? "dark dashboard-dark " : ""}h-[100dvh] overflow-hidden bg-canvas p-2 font-sans text-ink md:p-6`}>
    <div className="mx-auto flex h-full max-w-[1400px] flex-col rounded-[2rem] bg-panel p-3 md:p-6">
      <header className="flex shrink-0 flex-wrap items-center gap-3">
        <Link to="/dashboard" aria-label="veylo overview" className="flex items-center gap-2 rounded-full bg-background py-2 pl-2 pr-4 shadow-sm"><img src={mark} alt="" className="h-8 w-8" /><span className="font-bold">veylo</span></Link>
        <nav aria-label="Top navigation" className="order-3 flex w-full gap-1 overflow-x-auto rounded-full bg-background p-1.5 shadow-sm xl:order-none xl:mx-auto xl:w-auto">
          {topNavigation.map(t => <Button key={t.name} asChild variant="ghost" className="h-auto rounded-full p-0"><Link to={t.to} activeOptions={{ exact: true }} activeProps={{ className: "bg-ink text-background hover:bg-ink hover:text-background" }} inactiveProps={{ className: "text-muted-foreground" }} className="whitespace-nowrap px-4 py-2 text-sm">{t.name}</Link></Button>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <div className="flex gap-1 rounded-full bg-background p-1.5 shadow-sm">
            {([{ name: "Search", to: "/search", icon: Search }, { name: "Notifications", to: "/notifications", icon: Bell }, { name: "Help", to: "/help", icon: Info }] as const).map(({name: label, to, icon: I}) => <Button key={label} asChild variant="ghost" size="icon" className="rounded-full"><Link to={to} aria-label={label} title={label}><I /></Link></Button>)}
          </div>
          <Link to="/account" aria-label="Business account" className="flex items-center gap-2 rounded-full bg-background py-1.5 pl-1.5 pr-3 shadow-sm">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand">{name.charAt(0).toUpperCase()}</div>
            <div className="hidden max-w-[140px] leading-tight sm:block"><p className="truncate text-sm font-semibold">{data.business.name}</p><p className="truncate text-xs text-muted-foreground">{data.business.contact_email || data.business.industry}</p></div><ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      </header>
      <div className="mt-5 flex min-h-0 flex-1 gap-3 md:gap-6">
        <aside aria-label="Side navigation" className="flex w-12 shrink-0 flex-col justify-between gap-2">
          <div className="min-h-0 overflow-y-auto">
            <div className="mb-3 flex flex-col gap-1 rounded-full bg-background p-1.5 shadow-sm">
              <Button aria-label="Light theme" aria-pressed={!dark} title="Light theme" variant="ghost" size="icon" onClick={() => changeTheme("light")} className={`rounded-full ${!dark ? "bg-muted text-brand" : "text-muted-foreground"}`}><Sun /></Button>
              <Button aria-label="Dark theme" aria-pressed={dark} title="Dark theme" variant="ghost" size="icon" onClick={() => changeTheme("dark")} className={`rounded-full ${dark ? "bg-muted text-brand" : "text-muted-foreground"}`}><Moon /></Button>
            </div>
            <nav className="flex flex-col gap-1 rounded-full bg-background p-1.5 shadow-sm">{sideNavigation.map(({ name: label, to, icon: I }) => <Button key={label} asChild variant="ghost" size="icon" className="rounded-full"><Link to={to} aria-label={label} title={label} activeOptions={{exact: true}} activeProps={{className: "bg-ink text-background hover:bg-ink hover:text-background"}} inactiveProps={{className: "text-muted-foreground"}}><I /></Link></Button>)}</nav>
          </div>
          <div className="flex shrink-0 flex-col gap-1 rounded-full bg-background p-1.5 shadow-sm"><Button asChild variant="ghost" size="icon" className="rounded-full"><Link to="/help" aria-label="Help center" title="Help center"><CircleHelp /></Link></Button><Button aria-label="Sign out" title="Sign out" onClick={signOut} variant="ghost" size="icon" className="rounded-full"><LogOut /></Button></div>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto pb-4 pr-1">{children}</main>
      </div>
    </div>
  </div>;
}
