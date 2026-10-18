import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { inboxSchema, messagePageSchema } from "./whatsapp-schema";

const inboxInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  before: z.string().datetime().nullable().default(null),
});
export const getWhatsAppInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => inboxInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: inbox, error } = await context.supabase.rpc("list_whatsapp_inbox", {
      p_limit: data.limit,
      p_before: data.before,
    });
    if (error) throw new Error("WhatsApp conversations could not be loaded.");
    const parsed = inboxSchema.safeParse(inbox);
    if (!parsed.success)
      throw new Error("WhatsApp returned conversation data in an unexpected format.");
    return parsed.data;
  });

export const getWhatsAppConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: business, error: businessError } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (businessError) throw new Error("WhatsApp connection status could not be loaded.");
    if (!business) return null;
    const { data, error } = await context.supabase
      .from("whatsapp_integrations")
      .select("status,display_phone_number,last_error,verified_at,business_account_id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (error) throw new Error("WhatsApp connection status could not be loaded.");
    return data;
  });

export const getWhatsAppMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        limit: z.number().int().min(1).max(100).default(50),
        before: z
          .object({ time: z.string().datetime(), id: z.string().uuid() })
          .nullable()
          .default(null),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: page, error } = await context.supabase.rpc("list_whatsapp_messages", {
      p_conversation_id: data.conversationId,
      p_limit: data.limit,
      p_before_time: data.before?.time ?? null,
      p_before_id: data.before?.id ?? null,
    });
    if (error) throw new Error("Conversation messages could not be loaded.");
    const parsed = messagePageSchema.safeParse(page);
    if (!parsed.success) throw new Error("WhatsApp returned messages in an unexpected format.");
    return parsed.data;
  });

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ conversationId: z.string().uuid(), text: z.string().trim().min(1).max(4096) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: prepared, error } = await context.supabase.rpc("prepare_whatsapp_message", {
      p_conversation_id: data.conversationId,
      p_text: data.text,
    });
    if (error || !prepared?.[0]) {
      const message = error?.message ?? "This conversation is not available for sending.";
      if (message.includes("24-hour customer service window")) {
        throw new Error(
          "The 24-hour customer service window has closed. Use an approved WhatsApp template.",
        );
      }
      if (message.includes("WhatsApp is not connected"))
        throw new Error("WhatsApp is not connected yet.");
      throw new Error("This conversation is not available for sending.");
    }
    const { deliverWhatsAppText } = await import("@/lib/whatsapp-cloud.server");
    const result = await deliverWhatsAppText({
      messageId: prepared[0].message_id,
      businessId: prepared[0].business_id,
      phoneNumberId: prepared[0].phone_number_id,
      recipient: prepared[0].recipient,
      text: data.text,
    });
    if (!result.ok) throw new Error(result.error);
    return result;
  });

export const connectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        phoneNumberId: z.string().trim().min(1).max(100),
        businessAccountId: z.string().trim().min(1).max(100),
        accessToken: z.string().trim().min(20).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: business, error } = await context.supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error || !business) throw new Error("Only the workspace owner can connect WhatsApp.");
    const { verifyAndStoreWhatsAppConnection } = await import("@/lib/whatsapp-cloud.server");
    await verifyAndStoreWhatsAppConnection({
      businessId: business.id,
      phoneNumberId: data.phoneNumberId,
      businessAccountId: data.businessAccountId,
      accessToken: data.accessToken,
    });
    return { connected: true };
  });
