import { createFileRoute, redirect } from "@tanstack/react-router";
import { getBusiness } from "@/lib/business.functions";
import { pageHead } from "@/lib/page-head";
import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsPage } from "@/components/dashboard-pages";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Settings", "Manage business configuration and connected services."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(options);
    if (!data.business) throw redirect({ to: "/onboarding" });
  },
  component: Page,
});
function Page() { return <DashboardShell><SettingsPage/></DashboardShell>; }
