import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/settings-page";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/settings/")({
  head: () =>
    pageHead("Business Profile Settings", "Update your business information and preferences."),
  component: SettingsPage,
});
