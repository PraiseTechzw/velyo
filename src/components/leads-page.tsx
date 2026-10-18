import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/dashboard-pages";
import { createLead, getLeads, updateLead, updateLeadStatus } from "@/lib/leads.functions";
import { leadStatuses, type LeadStatus } from "@/lib/leads-schema";

type Lead = {
  id: string;
  display_name: string;
  wa_id: string;
  lead_interest: string;
  lead_status: LeadStatus;
  lead_source: "WhatsApp" | "Manual";
  created_at: string;
};

export function LeadsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [editStatus, setEditStatus] = useState<LeadStatus>("New");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const load = useServerFn(getLeads);
  const add = useServerFn(createLead);
  const edit = useServerFn(updateLead);
  const setLeadStatus = useServerFn(updateLeadStatus);
  const leadsQuery = useQuery({
    queryKey: ["leads", query, status],
    queryFn: () => load({ data: { query, status: status as "All" | LeadStatus } }),
  });
  const result = leadsQuery.data;
  const rows = (result?.leads ?? []) as Lead[];

  function openCreate() {
    setEditing(null);
    setName(""); setPhone(""); setInterest(""); setEditStatus("New"); setError("");
    setDialogOpen(true);
  }
  function openEdit(lead: Lead) {
    setEditing(lead);
    setName(lead.display_name); setPhone(`+${lead.wa_id}`); setInterest(lead.lead_interest); setEditStatus(lead.lead_status); setError("");
    setDialogOpen(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await edit({ data: { id: editing.id, displayName: name, interest, status: editStatus } });
      else await add({ data: { displayName: name, phone, interest } });
      setDialogOpen(false);
      await client.invalidateQueries({ queryKey: ["leads"] });
      if (editing) setSelected((current) => current?.id === editing.id ? { ...current, display_name: name, lead_interest: interest, lead_status: editStatus } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lead could not be saved.");
    } finally { setSaving(false); }
  }
  async function changeStatus(lead: Lead, next: LeadStatus) {
    try {
      await setLeadStatus({ data: { id: lead.id, status: next } });
      await client.invalidateQueries({ queryKey: ["leads"] });
      setSelected((current) => current?.id === lead.id ? { ...current, lead_status: next } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lead status could not be updated.");
    }
  }

  return (
    <>
      <PageTitle title="Leads" detail="Customer interest, from first enquiry to purchase." sample={false}>
        <Button onClick={openCreate}><Plus />Add lead</Button>
      </PageTitle>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Leads", result?.total],
          ["Qualified", result?.byStatus.Qualified],
          ["Won", result?.byStatus.Won],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-background p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{leadsQuery.isLoading ? "—" : Number(value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search leads" placeholder="Search leads…" className="bg-background pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 max-w-full rounded-md border bg-background px-3 text-sm">
          {["All", ...leadStatuses].map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-panel text-xs text-muted-foreground"><tr>{["Lead", "Customer", "Interest / product", "Source", "Status", ""].map((heading) => <th key={heading} className="p-4 font-medium">{heading}</th>)}</tr></thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-t">
                <td className="p-4">{lead.id.slice(0, 8).toUpperCase()}</td>
                <td className="p-4 font-medium">{lead.display_name}<span className="mt-1 block text-xs font-normal text-muted-foreground">+{lead.wa_id}</span></td>
                <td className="p-4">{lead.lead_interest || "—"}</td>
                <td className="p-4">{lead.lead_source}</td>
                <td className="p-4"><select aria-label={`Status for ${lead.display_name}`} value={lead.lead_status} onChange={(event) => void changeStatus(lead, event.target.value as LeadStatus)} className={`rounded-full border-0 px-2 py-1 text-xs ${lead.lead_status === "Won" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}`}>{leadStatuses.map((value) => <option key={value}>{value}</option>)}</select></td>
                <td className="p-4"><Button variant="ghost" size="sm" onClick={() => setSelected(lead)}>View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {leadsQuery.isLoading && <div className="py-16 text-center text-sm text-muted-foreground">Loading leads…</div>}
        {leadsQuery.isError && <div role="alert" className="py-16 text-center text-sm text-destructive">Leads could not be loaded. Please try again.</div>}
        {!leadsQuery.isLoading && !leadsQuery.isError && !rows.length && <div className="py-16 text-center text-sm text-muted-foreground">{query || status !== "All" ? "No leads match your filters." : "No leads yet. Add a lead to get started."}</div>}
      </div>
      {selected && <section className="mt-5 border-t py-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{selected.display_name} · {selected.lead_interest || "Lead details"}</h2><div className="flex gap-2"><Button variant="outline" onClick={() => openEdit(selected)}>Edit</Button><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div></div>
        <p className="mt-2 text-sm text-muted-foreground">+{selected.wa_id} · Added {new Date(selected.created_at).toLocaleDateString()} · {selected.lead_status} · {selected.lead_source}</p>
        <Button asChild variant="outline" className="mt-4"><a href={`https://wa.me/${selected.wa_id}`} target="_blank" rel="noreferrer"><MessageCircle />Open WhatsApp</a></Button>
      </section>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit lead" : "Add lead"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="lead-name">Customer name</Label><Input id="lead-name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></div>
            {!editing && <div className="space-y-2"><Label htmlFor="lead-phone">WhatsApp phone</Label><Input id="lead-phone" type="tel" required placeholder="+263771234567" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>}
            <div className="space-y-2"><Label htmlFor="lead-interest">Interest / product</Label><Textarea id="lead-interest" maxLength={200} value={interest} onChange={(event) => setInterest(event.target.value)} /></div>
            {editing && <div className="space-y-2"><Label htmlFor="lead-edit-status">Status</Label><select id="lead-edit-status" value={editStatus} onChange={(event) => setEditStatus(event.target.value as LeadStatus)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{leadStatuses.map((value) => <option key={value}>{value}</option>)}</select></div>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Save lead"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
