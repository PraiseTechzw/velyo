import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/reset-password")({ head: () => pageHead("Reset password", "Choose a new password for your veylo account."), component: ResetPassword });
function ResetPassword() {
  const [ready, setReady] = useState(false); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"; void supabase.auth.getUser().then(({ data }) => setReady(recovery && !!data.user)); }, []);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); const password = String(f.get("password")); if (password !== f.get("confirm")) { setError("Passwords do not match."); return; } setBusy(true); const result = await supabase.auth.updateUser({ password }); setError(result.error?.message ?? ""); setDone(!result.error); setBusy(false); }
  return <main className="min-h-screen bg-surface px-6 py-20 font-sans"><div className="mx-auto max-w-md"><h1 className="text-3xl font-bold">New password</h1>{done ? <><p role="status" className="my-6">Your password has been updated.</p><Button asChild><Link to="/dashboard">Go to your dashboard</Link></Button></> : ready ? <form onSubmit={submit} className="mt-8 space-y-5"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" /><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" name="confirm" type="password" required minLength={8} autoComplete="new-password" /><Button disabled={busy}>Save new password</Button></form> : <><p className="my-6 text-muted-foreground">Open the password reset link from your email to continue.</p><Button asChild variant="outline"><Link to="/auth">Back to login</Link></Button></>}{error && <p role="alert" className="mt-4 text-destructive">{error}</p>}</div></main>;
}