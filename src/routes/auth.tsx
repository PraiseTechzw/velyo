import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/components/auth-provider";
import { pageHead } from "@/lib/page-head";
import logo from "@/assets/veylo-logo-header.png";
import { z } from "zod";

export const Route = createFileRoute("/auth")({ validateSearch: z.object({ mode: z.enum(["signup", "login"]).optional() }), head: () => pageHead("Sign in or create an account", "Access your veylo business account and set up WhatsApp commerce automation."), component: AuthPage });
function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState(search.mode ?? "login");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { user, loading } = useAccount();
  const navigate = useNavigate();
  useEffect(() => { setMode(search.mode ?? "login"); }, [search.mode]);
  useEffect(() => { if (!loading && user) void navigate({ to: "/onboarding", replace: true }); }, [user, loading, navigate]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      if (forgot) {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setMessage("If an account exists, a password reset link is on its way. Check your email.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: String(form.get("name") ?? "") } } });
        if (result.error) throw result.error;
        if (!result.data.session) setMessage("Check your email to confirm your account, then sign in to set up your business.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        await navigate({ to: "/onboarding", replace: true });
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") {
    setBusy(true); setError("");
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (result.error) throw result.error; }
    catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed."); } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-surface px-6 py-8 font-sans text-foreground">
    <header className="mx-auto flex max-w-6xl items-center justify-between"><Link to="/"><img src={logo} alt="veylo" className="h-9 w-auto" /></Link><Button asChild variant="ghost"><Link to="/"><ArrowLeft /> Back to home</Link></Button></header>
    <div className="mx-auto max-w-md py-16 sm:py-20">
      <p className="mb-3 text-sm font-semibold text-brand">YOUR BUSINESS, CONNECTED</p>
      <h1 className="text-3xl font-bold">{forgot ? "Reset your password" : mode === "signup" ? "Start with veylo" : "Welcome back"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{forgot ? "Enter the email linked to your account." : mode === "signup" ? "Create your account. Make every conversation count." : "Sign in to your business account."}</p>
      {!forgot && <div className="mt-8 grid grid-cols-2 border-b"><Button variant="ghost" className={mode === "login" ? "border-b-2 border-brand rounded-none text-brand" : "rounded-none"} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Log in</Button><Button variant="ghost" className={mode === "signup" ? "border-b-2 border-brand rounded-none text-brand" : "rounded-none"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Sign up</Button></div>}
      {message ? <div role="status" className="mt-8 space-y-4 rounded-lg border bg-brand-soft p-6"><Mail className="text-brand" /><p className="text-sm">{message}</p><Button variant="outline" onClick={() => { setMessage(""); setMode("login"); setForgot(false); }}>Back to login</Button></div> : <>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {!forgot && mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Your name</Label><Input id="name" name="name" required minLength={2} autoComplete="name" className="h-11" /></div>}
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" required autoComplete="email" className="h-11" /></div>
          {!forgot && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => { setForgot(true); setError(""); }}>Forgot password?</Button>}</div><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-11" />{mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}</div>}
          <Button disabled={busy} className="h-11 w-full" type="submit">{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}{forgot ? "Send reset link" : mode === "signup" ? "Create account" : "Log in"}</Button>
        </form>
        {!forgot && <><div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div><div className="space-y-3"><Button variant="outline" disabled={busy} className="h-11 w-full bg-background" onClick={() => social("google")}>Continue with Google</Button><Button disabled={busy} className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continue with Lovable</Button></div></>}
      </>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {forgot && !message && <Button variant="link" className="mt-4 p-0" onClick={() => setForgot(false)}>Back to login</Button>}
    </div>
  </main>;
}