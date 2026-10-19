import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/notifications")({
  head: () => pageHead("Notifications", "Configure email notifications for your workspace."),
  component: NotificationsSettingsPage,
});
