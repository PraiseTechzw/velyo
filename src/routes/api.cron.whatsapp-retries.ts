import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/cron/whatsapp-retries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = await authenticateCronRequest(request);
        if (authError) return authError;
        try {
          const { data, error } = await supabaseAdmin.rpc("retry_failed_whatsapp_events", {
            p_batch_size: 20,
          });
          if (error)
            return Response.json({ error: "Webhook retries could not run." }, { status: 503 });
          return Response.json({ retried: data });
        } catch {
          return Response.json({ error: "Webhook retries are not configured." }, { status: 503 });
        }
      },
    },
  },
});
