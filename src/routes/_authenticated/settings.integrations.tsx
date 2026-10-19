import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/integrations")({
  head: () => pageHead("Integrations & API", "Connect services used by your workspace."),
  component: IntegrationsSettingsPage,
});
