import { createFileRoute } from "@tanstack/react-router";
import { WhatsAppIntegrationPage } from "@/components/whatsapp-integration-page";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/settings/whatsapp")({
  head: () =>
    pageHead("WhatsApp Integration", "Connect and manage your WhatsApp Business Platform."),
  component: WhatsAppIntegrationPage,
});
