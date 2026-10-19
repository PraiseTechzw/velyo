import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => pageHead("Security & Privacy", "Review account security and privacy settings."),
  component: SecuritySettingsPage,
});
