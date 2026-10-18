import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLeadSchema, listLeadsSchema, updateLeadSchema, updateLeadStatusSchema } from "./leads-schema";
import { createLeadForOwner, getLeadsForOwner, updateLeadForOwner, updateLeadStatusForOwner } from "./leads-store.server";

export const getLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => listLeadsSchema.parse(input))
  .handler(async ({ data, context }) => {
    return getLeadsForOwner(context.supabase, context.userId, data);
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => createLeadSchema.parse(input))
  .handler(async ({ data, context }) => {
    return createLeadForOwner(context.supabase, context.userId, data);
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => updateLeadSchema.parse(input))
  .handler(async ({ data, context }) => {
    return updateLeadForOwner(context.supabase, context.userId, data);
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => updateLeadStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    return updateLeadStatusForOwner(context.supabase, context.userId, data);
  });
