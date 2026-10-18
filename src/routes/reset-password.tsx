import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/page-head";
import { AuthLayout } from "@/components/auth-layout";
export const Route = createFileRoute("/reset-password")({ head: () => pageHead("Reset password", "Choose a new password for your veylo account."), component: ResetPassword });
function ResetPassword() {
  const [ready, setReady] = useState(false); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [showConfirmation, setShowConfirmation] = useState(false);
  useEffect(() => { const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"; void supabase.auth.getUser().then(({ data }) => setReady(recovery && !!data.user)); }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) { setError("Those passwords don’t match."); return; }
    setBusy(true);
    const result = await supabase.auth.updateUser({ password });
    setError(result.error?.message ?? ""); setDone(!result.error); setBusy(false);
  }
  return <AuthLayout>
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">Account recovery</p>
    <h1 className="text-3xl font-bold tracking-tight">{done ? "Password updated" : "Choose a new password"}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{done ? "Your account is ready. Sign in with your new password." : "Create a new password for your Veylo account."}</p>
    {done ? <div role="status" className="mt-7 rounded-2xl bg-brand-soft p-5"><div className="flex items-center gap-3 text-sm font-medium text-brand"><Check className="h-5 w-5" />Your password has been changed.</div><Button asChild className="mt-5 h-12 w-full rounded-xl"><Link to="/auth">Back to sign in <ArrowRight /></Link></Button></div> : ready ? <form onSubmit={submit} className="mt-7 space-y-5">
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="new-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" className="h-12 rounded-xl bg-white pl-10 pr-12" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="confirm-password" name="confirm" type={showConfirmation ? "text" : "password"} required minLength={8} autoComplete="new-password" className="h-12 rounded-xl bg-white pl-10 pr-12" /><button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground">{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
      <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
      <Button disabled={busy} className="h-12 w-full rounded-xl">{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}Save new password</Button>
    </form> : <div className="mt-7 rounded-2xl bg-muted/60 p-5"><p className="text-sm leading-6 text-muted-foreground">This reset link is missing or has expired. Request a new one to continue.</p><Button asChild variant="outline" className="mt-4 h-11 w-full rounded-xl bg-white"><Link to="/auth">Request another reset link</Link></Button></div>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
  </AuthLayout>;
}
