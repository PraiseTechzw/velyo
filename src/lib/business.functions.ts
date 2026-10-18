import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { businessSchema } from "./business-schema";
export const getBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, business, roles] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", context.userId)
        .single(),
      context.supabase.from("businesses").select("*").eq("owner_id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role,business_id").eq("user_id", context.userId),
    ]);
    if (profile.error || business.error || roles.error)
      throw new Error("Your business details could not be loaded.");
    return { profile: profile.data, business: business.data, roles: roles.data };
  });
export const saveBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => businessSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { display_name, avatar_url, ...business } = data;
    const saved = await context.supabase.rpc("save_business_profile", {
      profile_data: { display_name, avatar_url },
      business_data: business,
    });
    if (saved.error) throw new Error("Your business details could not be saved. Please try again.");
    return { id: saved.data };
  });
