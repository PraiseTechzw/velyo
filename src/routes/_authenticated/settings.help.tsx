import { createFileRoute } from "@tanstack/react-router";
import { HelpSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/help")({
  head: () => pageHead("Help & Support", "Get help setting up your business workspace."),
  component: HelpSettingsPage,
});
