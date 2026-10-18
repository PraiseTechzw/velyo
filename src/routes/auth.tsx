import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/components/auth-provider";
import { pageHead } from "@/lib/page-head";
import { AuthLayout } from "@/components/auth-layout";
import { z } from "zod";

export const Route = createFileRoute("/auth")({ validateSearch: z.object({ mode: z.enum(["signup", "login"]).optional() }), head: () => pageHead("Sign in or create an account", "Access your veylo business account and set up WhatsApp commerce automation."), component: AuthPage });
function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState(search.mode ?? "login");
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  async function social() {
    setBusy(true); setError("");
    try { const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth` } }); if (error) throw error; }
    catch (e) { setError(e instanceof Error ? e.message : "Sign-in failed."); } finally { setBusy(false); }
  }
  return <AuthLayout>
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand">{forgot ? "Account recovery" : "Welcome to Veylo"}</p>
      <h1 className="text-3xl font-bold tracking-tight">{forgot ? "Reset your password" : mode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{forgot ? "Enter your email and we’ll send you a secure reset link." : mode === "signup" ? "Set up your account and make every conversation count." : "Sign in to manage your business on WhatsApp."}</p>
      {!forgot && <div className="mt-7 grid grid-cols-2 rounded-xl bg-muted/70 p-1"><Button variant="ghost" className={mode === "login" ? "rounded-lg bg-white text-brand shadow-sm hover:bg-white" : "rounded-lg text-muted-foreground"} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Log in</Button><Button variant="ghost" className={mode === "signup" ? "rounded-lg bg-white text-brand shadow-sm hover:bg-white" : "rounded-lg text-muted-foreground"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Sign up</Button></div>}
      {message ? <div role="status" className="mt-8 space-y-4 rounded-lg border bg-brand-soft p-6"><Mail className="text-brand" /><p className="text-sm">{message}</p><Button variant="outline" onClick={() => { setMessage(""); setMode("login"); setForgot(false); }}>Back to login</Button></div> : <>
        <form onSubmit={submit} className="mt-7 space-y-5">
          {!forgot && mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Your name</Label><div className="relative"><UserRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="name" name="name" required minLength={2} autoComplete="name" className="h-12 rounded-xl bg-white pl-10" /></div></div>}
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" name="email" type="email" required autoComplete="email" className="h-12 rounded-xl bg-white pl-10" /></div></div>
          {!forgot && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{mode === "login" && <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => { setForgot(true); setError(""); }}>Forgot password?</Button>}</div><div className="relative"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-12 rounded-xl bg-white pl-10 pr-12" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"><span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{mode === "signup" && <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>}</div>}
          <Button disabled={busy} className="h-12 w-full rounded-xl" type="submit">{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}{forgot ? "Send reset link" : mode === "signup" ? "Create account" : "Log in"}</Button>
        </form>
        {!forgot && <><div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div><Button variant="outline" disabled={busy} className="h-12 w-full rounded-xl bg-white" onClick={social}><GoogleIcon />Continue with Google</Button></>}
      </>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {forgot && !message && <Button variant="link" className="mt-4 p-0" onClick={() => setForgot(false)}>Back to login</Button>}
  </AuthLayout>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
    <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
    <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
    <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.8 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3c1.6-4.9 6.1-8.5 11.4-8.5Z" />
  </svg>;
}
