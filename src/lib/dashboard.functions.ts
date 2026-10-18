import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { percentChange, workspaceMonthRanges } from "./dashboard-metrics";

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: business, error: businessError } = await context.supabase
      .from("businesses")
      .select("id,timezone")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (businessError) throw new Error("Dashboard data could not be loaded.");
    if (!business) return null;

    const months = workspaceMonthRanges(new Date(), business.timezone, 8);
    const conversationCounts = await Promise.all(months.map(async (month) => {
      const result = await context.supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .gte("created_at", month.start)
        .lt("created_at", month.end);
      if (result.error) throw new Error("Dashboard data could not be loaded.");
      return result.count ?? 0;
    }));

    const currentMonth = months.at(-1)!;
    const previousMonth = months.at(-2)!;
    const [messageCount, integration] = await Promise.all([
      context.supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .gte("occurred_at", currentMonth.start)
        .lt("occurred_at", currentMonth.end),
      context.supabase
        .from("whatsapp_integrations")
        .select("status")
        .eq("business_id", business.id)
        .maybeSingle(),
    ]);
    if (messageCount.error || integration.error) throw new Error("Dashboard data could not be loaded.");

    const currentConversations = conversationCounts.at(-1)!;
    const priorConversations = conversationCounts.at(-2)!;
    return {
      conversations: currentConversations,
      conversationsChange: percentChange(currentConversations, priorConversations),
      messagesThisMonth: messageCount.count ?? 0,
      whatsappStatus: integration.data?.status ?? "not_configured",
      chart: months.map((month, index) => ({ m: month.label, chats: conversationCounts[index] })),
    };
  });
