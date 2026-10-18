import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { businessSchema, type BusinessInput } from "@/lib/business-schema";
import { saveBusiness } from "@/lib/business.functions";

const steps = ["Business", "Preferences", "AI knowledge", "WhatsApp"];
export function BusinessForm({ initial, onboarding, onSaved }: { initial: BusinessInput; onboarding?: boolean; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState(initial); const [step, setStep] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  const save = useServerFn(saveBusiness);
  function field(key: keyof BusinessInput, label: string, multiline = false, required = false) {
    const common = { id: key, value: String(values[key]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues(v => ({ ...v, [key]: e.target.value })), required, className: multiline ? "min-h-28 bg-background" : "h-11 bg-background" };
    return <div className="space-y-2" key={key}><Label htmlFor={key}>{label}{required ? " *" : ""}</Label>{multiline ? <Textarea {...common} /> : <Input {...common} type={key === "contact_email" ? "email" : key === "avatar_url" ? "url" : "text"} />}</div>;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaved(false);
    if (onboarding && step < 3) { setStep(s => s + 1); return; }
    const parsed = businessSchema.safeParse(values);
    if (!parsed.success) { const issue = parsed.error.issues[0]; setError(`${String(issue?.path[0] ?? "Details").replaceAll("_", " ")}: ${issue?.message ?? "Check your details"}`); return; }
    setBusy(true);
    try { await save({ data: parsed.data }); setSaved(true); await onSaved(); } catch (e) { setError(e instanceof Error ? e.message : "Your details could not be saved."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-8">
    {onboarding && <ol className="mb-10 grid grid-cols-4 gap-2 border-b pb-6">{steps.map((name, i) => <li key={name} className={`flex flex-col gap-2 text-xs sm:text-sm ${i === step ? "font-semibold text-brand" : "text-muted-foreground"}`}><span className={`grid h-8 w-8 place-items-center rounded-full ${i <= step ? "bg-brand text-primary-foreground" : "bg-muted"}`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>{name}</li>)}</ol>}
    <div className="space-y-10">
      {(!onboarding || step === 0) && <section><h2 className="mb-6 text-xl font-semibold">Your business</h2><div className="grid gap-5 sm:grid-cols-2">{field("display_name", "Your name", false, true)}{field("name", "Business name", false, true)}<div className="space-y-2"><Label htmlFor="industry">Industry</Label><select id="industry" className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={values.industry} onChange={e => setValues(v => ({ ...v, industry: e.target.value }))}><option value="">Select industry</option>{["Clothing & boutiques", "Online retail", "Food & hospitality", "Health & beauty", "Professional services", "Other"].map(x => <option key={x}>{x}</option>)}</select></div>{field("contact_email", "Business email")}{field("contact_phone", "Contact phone")}{field("address", "Business address")}</div><div className="mt-5">{field("description", "Business description", true)}</div>{!onboarding && <div className="mt-5">{field("avatar_url", "Avatar URL (optional)")}</div>}</section>}
      {(!onboarding || step === 1) && <section><h2 className="mb-6 text-xl font-semibold">Business preferences</h2><div className="grid gap-5 sm:grid-cols-2">{([ ["currency", "Currency", ["USD", "ZWG", "ZAR", "EUR", "GBP"]], ["language", "Language", ["English", "Shona", "Ndebele"]] ] as const).map(([key, label, options]) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label}</Label><select id={key} className="h-11 w-full rounded-md border bg-background px-3 text-sm" value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}>{options.map(x => <option key={x}>{x}</option>)}</select></div>)}</div><div className="mt-5">{field("operating_hours", "Operating hours", true)}</div><div className="mt-6 flex items-center justify-between border-y py-5"><Label htmlFor="notifications">Email notifications</Label><Switch id="notifications" checked={values.notifications} onCheckedChange={notifications => setValues(v => ({ ...v, notifications }))} /></div></section>}
      {(!onboarding || step === 2) && <section><h2 className="mb-6 text-xl font-semibold">AI knowledge</h2><div className="grid gap-5">{field("products", "Products, prices & stock", true)}{field("faqs", "Frequently asked questions & answers", true)}{field("delivery_policy", "Delivery & payment policies", true)}{field("ai_instructions", "Business-specific instructions", true)}</div></section>}
      {(!onboarding || step === 3) && <section><h2 className="mb-2 text-xl font-semibold">WhatsApp details</h2><p className="mb-6 text-sm text-muted-foreground">Connection status: not connected</p><div className="grid gap-5 sm:grid-cols-2">{field("whatsapp_phone_number_id", "Phone number ID (optional)")}{field("whatsapp_business_account_id", "Business account ID (optional)")}</div><p className="mt-4 text-xs text-muted-foreground">These identifiers don’t connect WhatsApp. Access tokens are not collected here.</p>{onboarding && <div className="mt-8 border-t pt-6"><h3 className="font-semibold">Ready to save</h3><p className="mt-2 text-sm text-muted-foreground">{values.name} · {values.currency} · {values.language}</p></div>}</section>}
    </div>
    {error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}{saved && <p role="status" className="mt-6 flex items-center gap-2 text-sm text-brand"><Check className="h-4 w-4" /> Changes saved</p>}
    <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6">{onboarding && step > 0 ? <Button type="button" variant="outline" onClick={() => { setStep(s => s - 1); setError(""); }}><ArrowLeft /> Back</Button> : <span className="text-xs text-muted-foreground">Private to your business</span>}<Button type="submit" disabled={busy} className="h-11">{busy ? <Loader2 className="animate-spin" /> : onboarding && step < 3 ? <ArrowRight /> : <Save />}{onboarding ? step < 3 ? "Continue" : "Finish setup" : "Save changes"}</Button></div>
  </form>;
}