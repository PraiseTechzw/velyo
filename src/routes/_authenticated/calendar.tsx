import { createFileRoute, redirect } from "@tanstack/react-router";
import { getBusiness } from "@/lib/business.functions";
import { pageHead } from "@/lib/page-head";
import { DashboardShell } from "@/components/dashboard-shell";
import { CalendarPage } from "@/components/dashboard-pages";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => pageHead("Calendar", "Review scheduled follow-ups and campaigns."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(options);
    if (!data.business) throw redirect({ to: "/onboarding" });
  },
  component: Page,
});
function Page() { return <DashboardShell><CalendarPage/></DashboardShell>; }
