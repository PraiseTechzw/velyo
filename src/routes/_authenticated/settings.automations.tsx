import { createFileRoute } from "@tanstack/react-router";
import { AutomationsSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/automations")({
  head: () => pageHead("Automations", "Review business rules used by customer workflows."),
  component: AutomationsSettingsPage,
});
