import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getBusiness } from "@/lib/business.functions";
import { emptyBusiness } from "@/lib/business-schema";
import { BusinessForm } from "@/components/business-form";
import { AccountHeader } from "@/components/account-header";
import { pageHead } from "@/lib/page-head";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/onboarding")({ head: () => pageHead("Set up your business", "Create your private veylo business profile, preferences and AI knowledge."), loader: async ({ context }) => { const data = await context.queryClient.ensureQueryData(options); if (data.business) throw redirect({ to: "/dashboard" }); }, component: Onboarding });
function Onboarding() {
  const { data } = useSuspenseQuery(options);
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-surface font-sans">
      <AccountHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Let’s get you set up</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Set up your business</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">A few quick details help Veylo tailor the workspace to your business. You can update everything later.</p>
        </div>
        <BusinessForm
          initial={{ ...emptyBusiness, ...data.profile }}
          onboarding
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ["business"] });
            await navigate({ to: "/dashboard", replace: true });
          }}
        />
      </main>
    </div>
  );
}
