import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { businessSchema } from "./business-schema";
import { assistantSettingsSchema } from "./assistant-schema";
import { z } from "zod";
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

export const updateNotificationPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("businesses")
      .update({ notifications: data.enabled })
      .eq("owner_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("Notification preference could not be saved.");
    return { enabled: data.enabled };
  });

export const updateBusinessVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ visible: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("businesses")
      .update({ profile_visible: data.visible })
      .eq("owner_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("Business profile visibility could not be saved.");
    return { visible: data.visible };
  });

export const saveAssistantSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => assistantSettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: updated, error } = await context.supabase
      .from("businesses")
      .update(data)
      .eq("owner_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("AI assistant settings could not be saved.");
    return { id: updated.id };
  });
