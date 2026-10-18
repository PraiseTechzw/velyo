import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ArrowDown, ArrowUp, Bell, Bot, Calendar, ChevronDown, CircleHelp, Info, LayoutGrid, Layers,
  LogOut, Mail, Moon, MoreHorizontal, Package, Plus, Search, Settings, SlidersHorizontal, Sun,
  Users, FileText, MessageCircle, UserCheck, ShoppingBag, TrendingUp, Send, Hand,
} from "lucide-react";
import { getBusiness } from "@/lib/business.functions";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardShell } from "@/components/dashboard-shell";

const options = { queryKey: ["business"], queryFn: () => getBusiness() };

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Track WhatsApp conversations, leads and sales for your business."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(options);
    if (!data.business) throw redirect({ to: "/onboarding" });
  },
  component: Dashboard,
});

// Sample figures until live WhatsApp data is connected.
const chart = [
  { m: "Jan", sales: 23, chats: 13 }, { m: "Feb", sales: 18, chats: 24 }, { m: "Mar", sales: 14, chats: 20 },
  { m: "Apr", sales: 17, chats: 17 }, { m: "May", sales: 18, chats: 25 }, { m: "Jun", sales: 28, chats: 18 },
  { m: "Jul", sales: 19, chats: 18 }, { m: "Aug", sales: 15, chats: 18 },
];
const activities = [
  { id: "ORD_000076", what: "Black hoodie (M)", who: "Tendai M.", price: "$49.99", status: "Completed", date: "17 Oct, 2026 03:45 PM" },
  { id: "ORD_000075", what: "Delivery enquiry", who: "Rudo K.", price: "$0.00", status: "Pending", date: "17 Oct, 2026 11:30 AM" },
  { id: "ORD_000074", what: "Sneakers (size 9)", who: "Farai C.", price: "$85.00", status: "Completed", date: "16 Oct, 2026 12:00 PM" },
  { id: "ORD_000073", what: "Summer dress bundle", who: "Nyasha P.", price: "$120.00", status: "In Progress", date: "16 Oct, 2026 09:15 PM" },
  { id: "ORD_000072", what: "Price check — jeans", who: "Kuda B.", price: "$35.00", status: "Completed", date: "15 Oct, 2026 06:00 AM" },
];
const statusDot: Record<string, string> = { Completed: "bg-brand", Pending: "bg-destructive", "In Progress": "bg-sun" };
const tabs = ["Overview", "Chats", "Leads", "Orders", "Account", "Reports"];
const side = [LayoutGrid, Calendar, Mail, FileText, Users, Layers, Settings];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { data } = useSuspenseQuery(options);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [checked, setChecked] = useState<string[]>(["ORD_000073"]);
  const [q, setQ] = useState("");
  if (!data.business) return null;
  const name = data.profile.display_name || data.business.name;
  const first = name.split(" ")[0];
  const rows = activities.filter((a) => (a.what + a.who + a.id).toLowerCase().includes(q.toLowerCase()));

  async function signOut() {
    await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <DashboardShell>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{greeting()}, {first}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Stay on top of your chats, follow up on leads, and track your sales.</p>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.15fr_1.15fr]">
              {/* Left column */}
              <div className="flex flex-col gap-4">
                <section className="rounded-3xl bg-background p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales via WhatsApp</p>
                      <p className="mt-1 text-3xl font-semibold">$6,893.72</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs">{data.business.currency} <ChevronDown className="h-3 w-3" /></span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-0.5 rounded-full bg-brand-soft px-2 py-0.5 text-brand"><ArrowUp className="h-3 w-3" />5%</span> than last month</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 rounded-full bg-lime py-3 text-sm font-medium text-ink"><Send className="h-4 w-4" />Broadcast</button>
                    <button className="flex items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-medium"><Hand className="h-4 w-4" />Take over</button>
                  </div>
                  <div className="mt-4 rounded-2xl bg-panel p-3">
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-ink">Channels</span> | Total 3 channels</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { n: "WhatsApp", v: "1,284", s: "Active", ok: true },
                        { n: "AI Agent", v: "962", s: "Active", ok: true },
                        { n: "Manual", v: "322", s: "Paused", ok: false },
                      ].map((c) => (
                        <div key={c.n} className="rounded-xl bg-background p-2.5">
                          <p className="text-xs font-medium">{c.n}</p>
                          <p className="mt-2 text-sm font-semibold">{c.v}</p>
                          <p className="text-[10px] text-muted-foreground">messages this month</p>
                          <p className={`mt-1 text-[10px] font-medium ${c.ok ? "text-brand" : "text-destructive"}`}>{c.s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl bg-background p-4 shadow-sm">
                  <p className="font-medium">Monthly Message Limit</p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-stripes">
                    <div className="h-full w-[26%] rounded-full bg-brand" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs"><span><b>1,400</b> <span className="text-muted-foreground">used out of</span></span><b>5,500</b></div>
                </section>

                <section className="rounded-3xl bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-medium"><Package className="h-5 w-5" />Top Products</p>
                    <button className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"><Plus className="h-3 w-3" />Add new</button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-card-dark p-3 text-background">
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-ink">Best seller</span>
                      <p className="mt-8 text-[10px] opacity-70">Black hoodie</p>
                      <div className="flex justify-between text-xs"><span>142 sold</span><span>$49.99</span></div>
                    </div>
                    <div className="rounded-2xl bg-card-green p-3 text-background">
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-ink">Trending</span>
                      <p className="mt-8 text-[10px] opacity-70">Summer dress</p>
                      <div className="flex justify-between text-xs"><span>98 sold</span><span>$40.00</span></div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Middle + right */}
              <div className="flex flex-col gap-4 xl:col-span-2">
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="grid grid-cols-2 gap-3 rounded-3xl bg-background p-3 shadow-sm">
                    <Stat dark icon={MessageCircle} label="Conversations" value="950" change="7%" up />
                    <Stat icon={Bot} label="AI Replies" value="700" change="5%" />
                    <Stat icon={UserCheck} label="Leads Captured" value="1,050" change="8%" up />
                    <Stat icon={ShoppingBag} label="Orders" value="850" change="4%" up />
                  </section>
                  <section className="rounded-3xl bg-background p-4 shadow-sm">
                    <p className="text-lg font-medium">Sales Performance</p>
                    <p className="text-xs text-muted-foreground">See your chats and sales over a period of time</p>
                    <div className="mt-3 rounded-2xl bg-panel p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Sales and Chats</span>
                        <span className="flex gap-3"><span className="flex items-center gap-1"><i className="h-2 w-2 bg-lime" />Sales</span><span className="flex items-center gap-1"><i className="h-2 w-2 bg-ink" />Chats</span></span>
                      </div>
                      <div className="mt-2 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chart} margin={{ left: -20, right: 0, top: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                            <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `${v}k`} />
                            <Bar dataKey="chats" stackId="a" fill="var(--ink)" radius={[6, 6, 6, 6]} />
                            <Bar dataKey="sales" stackId="a" fill="var(--lime)" radius={[6, 6, 6, 6]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="rounded-3xl bg-background p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-medium">Recent Activities</p>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                        <Search className="h-4 w-4" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-32 bg-transparent outline-none" />
                      </label>
                      <button className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm">Filter <SlidersHorizontal className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-2xl border">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-panel text-left text-xs text-muted-foreground">
                        <tr><th className="w-10 p-3" /><th className="p-3 font-normal">Order ID</th><th className="p-3 font-normal">Activity</th><th className="p-3 font-normal">Price</th><th className="p-3 font-normal">Status</th><th className="p-3 font-normal">Date</th><th /></tr>
                      </thead>
                      <tbody>
                        {rows.map((a) => {
                          const on = checked.includes(a.id);
                          return (
                            <tr key={a.id} className={`border-t ${on ? "bg-panel" : ""}`}>
                              <td className="p-3"><Checkbox checked={on} onCheckedChange={(v) => setChecked((c) => v ? [...c, a.id] : c.filter((x) => x !== a.id))} /></td>
                              <td className="p-3">{a.id}</td>
                              <td className="p-3"><span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-soft text-brand"><MessageCircle className="h-3.5 w-3.5" /></span>{a.what}<span className="text-xs text-muted-foreground">· {a.who}</span></span></td>
                              <td className="p-3">{a.price}</td>
                              <td className="p-3"><span className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${statusDot[a.status]}`} />{a.status}</span></td>
                              <td className="whitespace-nowrap p-3">{a.date}</td>
                              <td className="p-3"><MoreHorizontal className="h-4 w-4" /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
    </DashboardShell>
  );
}

function Stat({ icon: I, label, value, change, up, dark }: { icon: typeof TrendingUp; label: string; value: string; change: string; up?: boolean; dark?: boolean }) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl p-3 ${dark ? "bg-earnings text-background" : "bg-panel"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-full ${dark ? "bg-background/20" : "bg-muted"}`}><I className="h-4 w-4" /></span>
      </div>
      <p className="mt-6 text-3xl font-semibold">{value}</p>
      <p className="mt-2 flex items-center gap-2 text-[11px]">
        <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${dark ? "bg-background/20" : up ? "bg-brand-soft text-brand" : "bg-destructive/10 text-destructive"}`}>
          {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{change}
        </span>
        <span className={dark ? "opacity-80" : "text-muted-foreground"}>This month</span>
      </p>
    </div>
  );
}
