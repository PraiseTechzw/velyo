import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Package,
  Search,
  Send,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { conversations, orders, performance } from "@/lib/dashboard-data";
import { connectWhatsApp, getWhatsAppConnection } from "@/lib/whatsapp.functions";

export function PageTitle({
  title,
  detail,
  sample = true,
  children,
}: {
  title: string;
  detail: string;
  sample?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {sample && (
            <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
              Sample data
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </div>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-sm text-muted-foreground">{text}</div>;
}
function Filter({
  query,
  setQuery,
  status,
  setStatus,
  statuses,
}: {
  query: string;
  setQuery: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statuses: string[];
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label="Search records"
          placeholder="Search…"
          className="bg-background pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-9 max-w-full rounded-md border bg-background px-3 text-sm"
      >
        {["All", ...statuses].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
export { WhatsAppChatsPage as ChatsPage } from "./whatsapp-chats";
export function RecordsPage({ kind }: { kind: "leads" | "orders" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const isOrders = kind === "orders";
  const rows = orders
    .map((o, i) => ({
      ...o,
      status: isOrders ? o.status : ["Qualified", "New", "Won", "Contacted", "Qualified"][i],
    }))
    .filter(
      (o) =>
        (status === "All" || o.status === status) &&
        (o.customer + o.id + o.product).toLowerCase().includes(query.toLowerCase()),
    );
  const detail = rows.find((o) => o.id === selected);
  return (
    <>
      <PageTitle
        title={isOrders ? "Orders" : "Leads"}
        detail={
          isOrders
            ? "Sales and fulfilment at a glance."
            : "Customer interest, from first enquiry to purchase."
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {(isOrders
          ? [
              ["Sample orders", "5"],
              ["Completed", "3"],
              ["Pending / in progress", "2"],
            ]
          : [
              ["Sample leads", "5"],
              ["Qualified", "2"],
              ["Won", "1"],
            ]
        ).map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <Filter
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        statuses={
          isOrders
            ? ["Completed", "Pending", "In Progress"]
            : ["New", "Contacted", "Qualified", "Won"]
        }
      />
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-panel text-xs text-muted-foreground">
            <tr>
              {[
                isOrders ? "Order" : "Lead",
                "Customer",
                "Interest / product",
                isOrders ? "Amount (USD)" : "Source",
                "Status",
                "",
              ].map((v, i) => (
                <th key={i} className="p-4 font-medium">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-4">{isOrders ? o.id : o.id.replace("ORD", "LEAD")}</td>
                <td className="p-4 font-medium">{o.customer}</td>
                <td className="p-4">{o.product}</td>
                <td className="p-4">{isOrders ? o.amount.toFixed(2) : "WhatsApp"}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${o.status === "Completed" || o.status === "Won" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(o.id)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text="No records match your filters." />}
      </div>
      {detail && (
        <section className="mt-5 border-t py-5">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">
              {detail.customer} · {detail.product}
            </h2>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {detail.date} · {detail.status} · Sample record
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/chats">
              <MessageCircle />
              Open chats
            </Link>
          </Button>
        </section>
      )}
    </>
  );
}
export function ReportsPage() {
  const [period, setPeriod] = useState("All months");
  const data = period === "Last 3 months" ? performance.slice(-3) : performance;
  function download() {
    const text =
      "Month,Sales USD,Chats\n" + data.map((r) => `${r.month},${r.sales},${r.chats}`).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "veylo-sample-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageTitle title="Reports" detail="Conversation and sales performance.">
        <Button variant="outline" onClick={download}>
          <ArrowDownToLine />
          Export sample CSV
        </Button>
      </PageTitle>
      <select
        className="mb-6 h-9 rounded-md border bg-background px-3 text-sm"
        aria-label="Report period"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
      >
        <option>All months</option>
        <option>Last 3 months</option>
      </select>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border bg-background p-5">
          <ShoppingBag className="h-5 w-5 text-brand" />
          <p className="mt-4 text-sm text-muted-foreground">Sales · USD</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.reduce((a, r) => a + r.sales, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-5">
          <MessageCircle className="h-5 w-5 text-brand" />
          <p className="mt-4 text-sm text-muted-foreground">Conversations</p>
          <p className="mt-2 text-3xl font-semibold">
            {data.reduce((a, r) => a + r.chats, 0).toLocaleString()}
          </p>
        </div>
      </div>
      <section className="mt-7">
        <h2 className="mb-5 text-lg font-semibold">Monthly sales · USD</h2>
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--ink)",
                }}
              />
              <Bar dataKey="sales" fill="var(--brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
export function CalendarPage() {
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [day, setDay] = useState(18);
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const event =
    month.getMonth() === 9 && month.getFullYear() === 2026 && [19, 21, 23].includes(day);
  return (
    <>
      <PageTitle title="Calendar" detail="Follow-ups and scheduled activity." />
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <Button
            aria-label="Previous month"
            title="Previous month"
            size="icon"
            variant="outline"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
              setDay(1);
            }}
          >
            <ChevronLeft />
          </Button>
          <Button
            aria-label="Next month"
            title="Next month"
            size="icon"
            variant="outline"
            onClick={() => {
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
              setDay(1);
            }}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border bg-background">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="border-b py-3 text-center text-xs text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`blank-${i}`} className="border-b border-r" />
        ))}
        {Array.from({ length: days }, (_, i) => (
          <Button
            variant="ghost"
            key={i}
            onClick={() => setDay(i + 1)}
            className={`relative h-16 rounded-none border-b border-r sm:h-24 ${day === i + 1 ? "bg-brand-soft text-brand" : ""}`}
          >
            {i + 1}
            {month.getMonth() === 9 &&
              month.getFullYear() === 2026 &&
              [19, 21, 23].includes(i + 1) && (
                <span className="absolute bottom-3 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
          </Button>
        ))}
      </div>
      <section className="mt-6">
        <h2 className="font-semibold">
          {day} {month.toLocaleDateString("en", { month: "long" })}
        </h2>
        {event ? (
          <div className="mt-3 rounded-lg border bg-background p-4">
            <p className="font-medium">
              {day === 19
                ? "Follow up with Nyasha"
                : day === 21
                  ? "New arrivals broadcast"
                  : "Order collection reminder"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">10:00 · Sample event</p>
          </div>
        ) : (
          <Empty text="No scheduled activity for this date." />
        )}
      </section>
    </>
  );
}
export function BroadcastsPage() {
  const [compose, setCompose] = useState(false);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  return (
    <>
      <PageTitle title="Broadcasts" detail="Campaigns for your WhatsApp audience.">
        <Button variant="outline" onClick={() => setCompose((v) => !v)}>
          <Send />
          New sample draft
        </Button>
      </PageTitle>
      {compose && (
        <form
          className="mb-6 space-y-4 border-y py-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !text.trim()) return;
            setDrafts((d) => [title.trim(), ...d]);
            setTitle("");
            setText("");
            setCompose(false);
          }}
        >
          <Input
            required
            aria-label="Campaign name"
            placeholder="Campaign name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            required
            aria-label="Broadcast message"
            placeholder="Message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Preview only. No messages will be sent; drafts last until you leave this page.
          </p>
          <Button type="submit">Add sample draft</Button>
        </form>
      )}
      <div className="space-y-3">
        {[
          ...drafts.map((t) => [t, "Draft", "Not sent"]),
          ["Weekend collection", "Sent · sample", "124 recipients"],
          ["New arrivals", "Scheduled · sample", "21 Oct, 10:00"],
        ].map(([t, s, n], i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-5"
          >
            <div>
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{n}</p>
            </div>
            <span className="rounded-full bg-panel px-3 py-1 text-xs">{s}</span>
          </div>
        ))}
      </div>
    </>
  );
}
export function ProductsPage() {
  const [query, setQuery] = useState("");
  const items = [
    { name: "Black hoodie", price: "49.99", sold: 142 },
    { name: "Summer dress", price: "40.00", sold: 98 },
    { name: "Sneakers", price: "85.00", sold: 76 },
    { name: "Classic jeans", price: "35.00", sold: 54 },
  ];
  return (
    <>
      <PageTitle title="Products" detail="Your WhatsApp product catalogue." />
      <Input
        aria-label="Search products"
        placeholder="Search products…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-6 max-w-sm bg-background"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items
          .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p, i) => (
            <article key={p.name} className="overflow-hidden rounded-lg border bg-background">
              <div
                className={`grid h-36 place-items-center ${i % 2 ? "bg-panel" : "bg-brand-soft"}`}
              >
                <Package className="h-12 w-12 text-brand" />
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{p.name}</h2>
                <p className="mt-2 text-sm">USD {p.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.sold} sold · Sample product</p>
              </div>
            </article>
          ))}
      </div>
      {!items.some((p) => p.name.toLowerCase().includes(query.toLowerCase())) && (
        <Empty text="No matching products." />
      )}
    </>
  );
}
export function SettingsPage() {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();
  const connect = useServerFn(connectWhatsApp);
  const connection = useQuery({
    queryKey: ["whatsapp-connection"],
    queryFn: () => getWhatsAppConnection(),
  });
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
  return (
    <>
      <PageTitle
        title="Settings"
        detail="Business configuration and connected services."
        sample={false}
      />
      <section className="border-b pb-6">
        <h2 className="text-lg font-semibold">Business profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Name, currency, contact details and WhatsApp number.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/account">Edit business account</Link>
        </Button>
      </section>
      <section className="border-b py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">WhatsApp connection</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Official Meta WhatsApp Business Cloud API
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">
            {connection.isPending ? "Checking…" : status}
          </span>
        </div>
        {connection.data?.display_phone_number && (
          <p className="mt-3 text-sm">{connection.data.display_phone_number}</p>
        )}
        {connection.data?.last_error && (
          <p className="mt-3 rounded-md border border-destructive/30 p-3 text-sm text-destructive">
            {connection.data.last_error}
          </p>
        )}
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
          {status === "connected"
            ? "Veylo has received and verified a signed webhook event from Meta."
            : status === "pending"
              ? "Meta validated the phone and webhook subscription. Waiting for the first signed event; configure the callback URL and subscribe to the messages field in your Meta app."
              : "Connect a Meta app with a registered WhatsApp Business phone number and an access token with WhatsApp permissions. Veylo checks the phone and WABA subscription before saving the token encrypted."}
        </p>
        <details className="mt-5 max-w-2xl rounded-lg border bg-background p-4">
          <summary className="cursor-pointer font-medium">
            {status === "connected" || status === "pending"
              ? "Update connection"
              : "Connect WhatsApp"}
          </summary>
          <form onSubmit={submitConnection} className="mt-4 space-y-4">
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
      </section>
      <section className="py-6">
        <h2 className="text-lg font-semibold">Automation preview</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Preview preferences only. Live automation is not connected.
        </p>
        {["AI replies", "Lead capture", "Order updates"].map((s) => (
          <label key={s} className="flex items-center justify-between gap-3 border-b py-4 text-sm">
            {s}
            <Switch aria-label={s} />
          </label>
        ))}
      </section>
    </>
  );
}
export function HelpPage() {
  return (
    <>
      <PageTitle title="Help center" detail="Support for your veylo workspace." sample={false} />
      <div className="divide-y">
        {[
          [
            "Why am I seeing sample data?",
            "The Chats page uses persisted conversations. Products, leads, orders and reports are still clearly labeled sample data until those backend workflows are implemented.",
          ],
          [
            "Where can I update my business details?",
            "Open Account to edit your profile, currency, contact details and WhatsApp number.",
          ],
          [
            "Are sample replies sent to customers?",
            "No. Sample replies and broadcast drafts stay in this preview only and are never sent.",
          ],
          [
            "How do I export a report?",
            "Open Reports and choose Export sample CSV. The export contains only the displayed sample figures.",
          ],
        ].map(([q, a]) => (
          <details key={q} className="py-5">
            <summary className="cursor-pointer font-medium">{q}</summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/account">Business account</Link>
      </Button>
    </>
  );
}
export function NotificationsPage() {
  return (
    <>
      <PageTitle title="Notifications" detail="Updates from your workspace." sample={false} />
      <Empty text="You're all caught up. No new notifications." />
      <Button asChild variant="outline">
        <Link to="/dashboard">Back to overview</Link>
      </Button>
    </>
  );
}
export function SearchPage() {
  const [q, setQ] = useState("");
  const items = [
    ...conversations.map((c) => ({
      label: c.name,
      detail: c.message,
      to: "/chats" as const,
      icon: Users,
    })),
    ...orders.map((o) => ({
      label: o.id,
      detail: o.product,
      to: "/orders" as const,
      icon: ShoppingBag,
    })),
    {
      label: "Business account",
      detail: "Profile and contact details",
      to: "/account" as const,
      icon: Users,
    },
    {
      label: "Reports",
      detail: "Sales and conversations",
      to: "/reports" as const,
      icon: ShoppingBag,
    },
  ];
  const rows = items.filter((i) => (i.label + i.detail).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle title="Search" detail="Find conversations, orders and workspace pages." />
      <Input
        autoFocus
        aria-label="Search workspace"
        placeholder="Search names, products or orders…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-6 bg-background"
      />
      <div className="divide-y">
        {rows.map((r, i) => (
          <Link key={i} to={r.to} className="flex items-center gap-4 py-4">
            <r.icon className="h-5 w-5 shrink-0 text-brand" />
            <span className="min-w-0">
              <span className="block font-medium">{r.label}</span>
              <span className="block truncate text-sm text-muted-foreground">{r.detail}</span>
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
          </Link>
        ))}
      </div>
      {!rows.length && <Empty text="No results found." />}
    </>
  );
}
