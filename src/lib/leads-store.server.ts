import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { createLeadSchema, listLeadsSchema, updateLeadSchema, updateLeadStatusSchema } from "./leads-schema";
import type { z } from "zod";

type Db = SupabaseClient<Database>;
type ListInput = z.infer<typeof listLeadsSchema>;
type CreateInput = z.infer<typeof createLeadSchema>;
type UpdateInput = z.infer<typeof updateLeadSchema>;
type StatusInput = z.infer<typeof updateLeadStatusSchema>;

export async function resolveOwnedBusinessId(supabase: Db, userId: string) {
  const { data, error } = await supabase.from("businesses").select("id").eq("owner_id", userId).maybeSingle();
  if (error || !data) throw new Error("Your workspace could not be loaded.");
  return data.id;
}

export async function getLeadsForOwner(supabase: Db, userId: string, data: ListInput) {
  return listLeadsForBusiness(supabase, await resolveOwnedBusinessId(supabase, userId), data);
}

export async function createLeadForOwner(supabase: Db, userId: string, data: CreateInput) {
  return insertLead(supabase, await resolveOwnedBusinessId(supabase, userId), data);
}

export async function updateLeadForOwner(supabase: Db, userId: string, data: UpdateInput) {
  return editLead(supabase, await resolveOwnedBusinessId(supabase, userId), data);
}

export async function updateLeadStatusForOwner(supabase: Db, userId: string, data: StatusInput) {
  return changeLeadStatus(supabase, await resolveOwnedBusinessId(supabase, userId), data);
}

export async function listLeadsForBusiness(supabase: Db, businessId: string, data: ListInput) {
  const statuses = ["New", "Contacted", "Qualified", "Won"] as const;
  const counts = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_lead", true),
    ...statuses.map((status) => supabase.from("contacts").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_lead", true).eq("lead_status", status)),
  ]);
  if (counts.some(({ error }) => error)) throw new Error("Leads could not be loaded.");
  let query = supabase.from("contacts").select("id,display_name,wa_id,lead_interest,lead_status,lead_source,created_at").eq("business_id", businessId).eq("is_lead", true).order("created_at", { ascending: false }).limit(200);
  if (data.status !== "All") query = query.eq("lead_status", data.status);
  if (data.query) {
    const term = data.query.replace(/[\\%_*]/g, "\\$&");
    query = query.or(`display_name.ilike.%${term}%,wa_id.ilike.%${term}%,lead_interest.ilike.%${term}%`);
  }
  const { data: leads, error } = await query;
  if (error) throw new Error("Leads could not be loaded.");
  return {
    leads: leads ?? [],
    total: counts[0]?.count ?? 0,
    byStatus: Object.fromEntries(statuses.map((status, index) => [status, counts[index + 1]?.count ?? 0])) as Record<(typeof statuses)[number], number>,
  };
}

export async function insertLead(supabase: Db, businessId: string, data: CreateInput) {
  const { data: lead, error } = await supabase.from("contacts").upsert({
    business_id: businessId,
    wa_id: data.phone.slice(1),
    display_name: data.displayName,
    is_lead: true,
    lead_status: "New",
    lead_interest: data.interest,
    lead_source: "Manual",
  }, { onConflict: "business_id,wa_id" }).select("id").single();
  if (error || !lead) throw new Error(error?.code === "23505" ? "That phone number is already in use." : "Lead could not be saved.");
  return { id: lead.id as string };
}

export async function editLead(supabase: Db, businessId: string, data: UpdateInput) {
  const { data: lead, error } = await supabase.from("contacts").update({
    display_name: data.displayName,
    lead_interest: data.interest,
    lead_status: data.status,
  }).eq("business_id", businessId).eq("id", data.id).eq("is_lead", true).select("id").maybeSingle();
  if (error || !lead) throw new Error("Lead could not be updated.");
  return { id: lead.id as string };
}

export async function changeLeadStatus(supabase: Db, businessId: string, data: StatusInput) {
  const { data: lead, error } = await supabase.from("contacts").update({ lead_status: data.status })
    .eq("business_id", businessId).eq("id", data.id).eq("is_lead", true).select("id").maybeSingle();
  if (error || !lead) throw new Error("Lead status could not be updated.");
  return { id: lead.id as string };
}
