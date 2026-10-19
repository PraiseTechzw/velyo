import { createFileRoute } from "@tanstack/react-router";
import { BillingSettingsPage } from "@/components/settings-category-pages";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/_authenticated/settings/billing")({
  head: () => pageHead("Plan & Billing", "Manage your Veylo subscription and billing details."),
  component: BillingSettingsPage,
});
