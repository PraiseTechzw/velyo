import { createFileRoute } from "@tanstack/react-router";
import { TeamSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/team")({
  head: () => pageHead("Team & Permissions", "Manage access to your business workspace."),
  component: TeamSettingsPage,
});
