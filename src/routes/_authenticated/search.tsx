import { createFileRoute, redirect } from "@tanstack/react-router";
import { getBusiness } from "@/lib/business.functions";
import { pageHead } from "@/lib/page-head";
import { DashboardShell } from "@/components/dashboard-shell";
import { SearchPage } from "@/components/dashboard-pages";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/search")({
  head: () => pageHead("Search", "Search conversations, customers and orders in veylo."),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(options);
    if (!data.business) throw redirect({ to: "/onboarding" });
  },
  component: Page,
});
function Page() { return <DashboardShell><SearchPage/></DashboardShell>; }
