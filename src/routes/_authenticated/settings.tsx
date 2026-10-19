import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsLayout } from "@/components/settings-layout";
import { getBusiness } from "@/lib/business.functions";
import { pageHead } from "@/lib/page-head";

const options = { queryKey: ["business"], queryFn: () => getBusiness() };

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => pageHead("Settings", "Manage your Veylo workspace settings."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(options);
    if (!data.business) throw redirect({ to: "/onboarding" });
  },
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <DashboardShell>
      <SettingsLayout>
        <Outlet />
      </SettingsLayout>
    </DashboardShell>
  );
}
