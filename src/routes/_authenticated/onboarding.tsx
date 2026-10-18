import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getBusiness } from "@/lib/business.functions";
import { emptyBusiness } from "@/lib/business-schema";
import { BusinessForm } from "@/components/business-form";
import { AccountHeader } from "@/components/account-header";
import { pageHead } from "@/lib/page-head";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/onboarding")({ head: () => pageHead("Set up your business", "Create your private veylo business profile, preferences and AI knowledge."), loader: async ({ context }) => { const data = await context.queryClient.ensureQueryData(options); if (data.business) throw redirect({ to: "/dashboard" }); }, component: Onboarding });
function Onboarding() { const { data } = useSuspenseQuery(options); const navigate = useNavigate(); const { queryClient } = Route.useRouteContext(); return <div className="min-h-screen bg-surface font-sans"><AccountHeader /><main className="mx-auto max-w-3xl px-6 py-12"><p className="text-sm font-semibold text-brand">LET’S GET YOU SET UP</p><h1 className="mt-3 text-3xl font-bold">Welcome to veylo</h1><p className="mt-3 text-sm text-muted-foreground">A few details about your business, in one place.</p><BusinessForm initial={{ ...emptyBusiness, ...data.profile }} onboarding onSaved={async () => { await queryClient.invalidateQueries({ queryKey: ["business"] }); await navigate({ to: "/dashboard", replace: true }); }} /></main></div>; }