import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Bot, ChevronDown, Hand, MessageCircle, Package, Plus, Search, Send, ShoppingBag, SlidersHorizontal, TrendingUp, UserCheck } from "lucide-react";
import { getBusiness } from "@/lib/business.functions";
import { getDashboardMetrics } from "@/lib/dashboard.functions";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
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

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Dashboard() {
  const { data } = useSuspenseQuery(options);
  const metrics = useQuery({ queryKey: ["dashboard-metrics"], queryFn: () => getDashboardMetrics(), enabled: Boolean(data.business) });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  if (!data.business) return null;
  const name = data.profile.display_name || data.business.name;
  const first = name.split(" ")[0];
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
                      <p className="mt-1 text-3xl font-semibold">—</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs">{data.business.currency} <ChevronDown className="h-3 w-3" /></span>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">Sales data unavailable · order and payment records are not connected</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link to="/broadcasts" className="flex items-center justify-center gap-2 rounded-full bg-lime py-3 text-sm font-medium text-ink"><Send className="h-4 w-4" />Broadcast</Link>
                    <button title="Open a conversation in Chats to take over" onClick={() => void navigate({ to: "/chats" })} className="flex items-center justify-center gap-2 rounded-full bg-muted py-3 text-sm font-medium"><Hand className="h-4 w-4" />Take over</button>
                  </div>
                  <div className="mt-4 rounded-2xl bg-panel p-3">
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-ink">Channels</span> | {metrics.isLoading ? "Loading status…" : metrics.isError ? "Status unavailable" : metrics.data?.whatsappStatus === "connected" ? "WhatsApp connected" : metrics.data?.whatsappStatus === "error" ? "WhatsApp needs attention" : "WhatsApp not connected"}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { n: "WhatsApp", v: metrics.data ? metrics.data.messagesThisMonth.toLocaleString() : "—", s: metrics.data?.whatsappStatus === "connected" ? "Connected" : "Not connected", ok: metrics.data?.whatsappStatus === "connected" },
                        { n: "AI Agent", v: "—", s: "Not available", ok: false },
                        { n: "Manual", v: "—", s: "Not available", ok: false },
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
                    <div className="h-full rounded-full bg-brand" style={{ width: "0%" }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs"><span className="text-muted-foreground">Usage limits unavailable</span><b>—</b></div>
                </section>

                <section className="rounded-3xl bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2 font-medium"><Package className="h-5 w-5" />Top Products</p>
                    <Link to="/products" className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"><Plus className="h-3 w-3" />Add new</Link>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-card-dark p-3 text-background">
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-ink">No sales data</span>
                      <p className="mt-8 text-[10px] opacity-70">No product sales data</p>
                      <div className="flex justify-between text-xs"><span>— sold</span><span>—</span></div>
                    </div>
                    <div className="rounded-2xl bg-card-green p-3 text-background">
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] text-ink">No sales data</span>
                      <p className="mt-8 text-[10px] opacity-70">No product sales data</p>
                      <div className="flex justify-between text-xs"><span>— sold</span><span>—</span></div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Middle + right */}
              <div className="flex flex-col gap-4 xl:col-span-2">
                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="grid grid-cols-2 gap-3 rounded-3xl bg-background p-3 shadow-sm">
                    <Stat dark icon={MessageCircle} label="Conversations" value={metrics.data ? metrics.data.conversations.toLocaleString() : "—"} {...(metrics.data?.conversationsChange == null ? {} : { change: `${Math.abs(metrics.data.conversationsChange)}%` })} up={(metrics.data?.conversationsChange ?? 0) >= 0} />
                    <Stat icon={Bot} label="AI Replies" value="—" />
                    <Stat icon={UserCheck} label="Leads Captured" value="—" />
                    <Stat icon={ShoppingBag} label="Orders" value="—" />
                  </section>
                  <section className="rounded-3xl bg-background p-4 shadow-sm">
                    <p className="text-lg font-medium">Sales Performance</p>
                    <p className="text-xs text-muted-foreground">See your chats and sales over a period of time</p>
                    <div className="mt-3 rounded-2xl bg-panel p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Sales and Chats</span>
                        <span className="flex gap-3"><span className="flex items-center gap-1"><i className="h-2 w-2 bg-lime" />Sales unavailable</span><span className="flex items-center gap-1"><i className="h-2 w-2 bg-ink" />Chats</span></span>
                      </div>
                      <div className="mt-2 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.data?.chart ?? []} margin={{ left: -20, right: 0, top: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                            <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => Number(v).toLocaleString()} />
                            <Bar dataKey="chats" stackId="a" fill="var(--ink)" radius={[6, 6, 6, 6]} />
                          </BarChart>
                        </ResponsiveContainer>
                        {metrics.isLoading && <p className="mt-1 text-center text-xs text-muted-foreground">Loading dashboard data…</p>}
                        {metrics.isError && <p className="mt-1 text-center text-xs text-destructive">Dashboard data could not be loaded.</p>}
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
                      <button disabled title="Activity filters will be available when order and activity records are connected" className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">Filter <SlidersHorizontal className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-2xl border">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-panel text-left text-xs text-muted-foreground">
                        <tr><th className="w-10 p-3" /><th className="p-3 font-normal">Order ID</th><th className="p-3 font-normal">Activity</th><th className="p-3 font-normal">Price</th><th className="p-3 font-normal">Status</th><th className="p-3 font-normal">Date</th><th /></tr>
                      </thead>
                      <tbody>
                        <tr><td colSpan={7} className="border-t p-6 text-center text-sm text-muted-foreground">{metrics.isLoading ? "Loading activities…" : metrics.isError ? "Activities could not be loaded." : q ? "No matching activities." : "No order or activity records are available yet."}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
    </DashboardShell>
  );
}

function Stat({ icon: I, label, value, change, up, dark }: { icon: typeof TrendingUp; label: string; value: string; change?: string; up?: boolean; dark?: boolean }) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl p-3 ${dark ? "bg-earnings text-background" : "bg-panel"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-full ${dark ? "bg-background/20" : "bg-muted"}`}><I className="h-4 w-4" /></span>
      </div>
      <p className="mt-6 text-3xl font-semibold">{value}</p>
      <p className="mt-2 flex items-center gap-2 text-[11px]">
        {change ? <>
        <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${dark ? "bg-background/20" : up ? "bg-brand-soft text-brand" : "bg-destructive/10 text-destructive"}`}>
          {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{change}
        </span>
        <span className={dark ? "opacity-80" : "text-muted-foreground"}>This month</span>
        </> : <span className={dark ? "opacity-80" : "text-muted-foreground"}>Not available</span>}
      </p>
    </div>
  );
}
