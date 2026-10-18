import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { businessSchema } from "./business-schema";
export const getBusiness = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [profile, business, roles] = await Promise.all([
    context.supabase.from("profiles").select("display_name,avatar_url").eq("id", context.userId).single(),
    context.supabase.from("businesses").select("*").eq("owner_id", context.userId).maybeSingle(),
    context.supabase.from("user_roles").select("role,business_id").eq("user_id", context.userId),
  ]);
  if (profile.error || business.error || roles.error) throw new Error("Your business details could not be loaded.");
  return { profile: profile.data, business: business.data, roles: roles.data };
});
export const saveBusiness = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => businessSchema.parse(input)).handler(async ({ data, context }) => {
  const { display_name, avatar_url, ...business } = data;
  const created = await context.supabase.rpc("create_business", { business_name: business.name, business_industry: business.industry });
  if (created.error) throw new Error("Your business could not be created.");
  const saved = await context.supabase.from("businesses").update(business).eq("id", created.data).eq("owner_id", context.userId).select("id").single();
  if (saved.error) throw new Error("Your business details could not be saved.");
  const profile = await context.supabase.from("profiles").update({ display_name, avatar_url }).eq("id", context.userId);
  if (profile.error) throw new Error("Your profile could not be saved.");
  return { id: saved.data.id };
});