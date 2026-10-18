import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getBusiness } from "@/lib/business.functions";
import { businessSchema } from "@/lib/business-schema";
import { BusinessForm } from "@/components/business-form";
import { AccountHeader } from "@/components/account-header";
import { pageHead } from "@/lib/page-head";
const options = { queryKey: ["business"], queryFn: () => getBusiness() };
export const Route = createFileRoute("/_authenticated/account")({ head: () => pageHead("Business account", "Manage your veylo business profile, preferences and WhatsApp details."), loader: async ({ context }) => { const data = await context.queryClient.ensureQueryData(options); if (!data.business) throw redirect({ to: "/onboarding" }); }, component: Account });
function Account() { const { data } = useSuspenseQuery(options); const { queryClient } = Route.useRouteContext(); if (!data.business) return null; return <div className="min-h-screen bg-surface font-sans"><AccountHeader /><main className="mx-auto max-w-3xl px-6 py-12"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-brand">BUSINESS ACCOUNT</p><h1 className="mt-3 break-words text-3xl font-bold">{data.business.name}</h1></div><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-brand" />Owner</span></div><BusinessForm initial={businessSchema.parse({ ...data.business, ...data.profile })} onSaved={async () => { await queryClient.invalidateQueries({ queryKey: ["business"] }); }} /></main></div>; }