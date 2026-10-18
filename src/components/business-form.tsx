import { useState, type ChangeEvent, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { businessSchema, type BusinessInput } from "@/lib/business-schema";
import { saveBusiness } from "@/lib/business.functions";

const inputClass = "h-12 rounded-xl border-border bg-background px-3.5 shadow-none focus-visible:ring-brand/30";
const textareaClass = "min-h-28 rounded-xl border-border bg-background px-3.5 py-3 shadow-none focus-visible:ring-brand/30";

export function BusinessForm({ initial, onboarding, onSaved }: { initial: BusinessInput; onboarding?: boolean; onSaved: () => Promise<void> }) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = useServerFn(saveBusiness);

  function update<K extends keyof BusinessInput>(key: K, value: BusinessInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
    setSaved(false);
  }

  function field(key: keyof BusinessInput, label: string, options: { multiline?: boolean; required?: boolean; placeholder?: string; hint?: string } = {}) {
    const { multiline, required, placeholder, hint } = options;
    const common = {
      id: key,
      value: String(values[key]),
      placeholder,
      required,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value as BusinessInput[typeof key]),
      className: multiline ? textareaClass : inputClass,
    };

    return (
      <div className="space-y-2" key={key}>
        <Label htmlFor={key}>{label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}</Label>
        {multiline
          ? <Textarea {...common} />
          : <Input {...common} type={key === "contact_email" ? "email" : key === "avatar_url" ? "url" : "text"} />}
        {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
      </div>
    );
  }

  async function persist() {
    setError("");
    const parsed = businessSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const label = String(issue?.path[0] ?? "Details").replaceAll("_", " ");
      setError(`${label.charAt(0).toUpperCase()}${label.slice(1)}: ${issue?.message ?? "Check this detail and try again."}`);
      return;
    }

    setBusy(true);
    try {
      await save({ data: parsed.data });
      setSaved(true);
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your details could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (onboarding) {
      const missing = !values.display_name.trim() ? "Add your name to continue." : !values.name.trim() ? "Add your business name to continue." : "";
      if (missing) { setError(missing); return; }
    }
    await persist();
  }

  const isOnboarding = Boolean(onboarding);
  const showProfile = true;
  const showPreferences = !isOnboarding;
  const showKnowledge = !isOnboarding;

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="space-y-8">
        {showProfile && <section className="rounded-2xl border bg-background p-5 sm:p-7">
          <div className="mb-6"><h2 className="text-lg font-semibold">{onboarding ? "Tell us about your business" : "Business profile"}</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{onboarding ? "Just the basics for now. You can add more details whenever you’re ready." : "This information helps your team identify the business."}</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("display_name", "Your name", { required: onboarding, placeholder: "e.g. Tariro Moyo" })}
            {field("name", "Business name", { required: onboarding, placeholder: "e.g. Tariro Boutique" })}
            <div className="space-y-2"><Label htmlFor="industry">Industry <span className="font-normal text-muted-foreground">(optional)</span></Label><select id="industry" className="h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm shadow-none outline-none focus:ring-2 focus:ring-brand/30" value={values.industry} onChange={(event) => update("industry", event.target.value)}><option value="">Choose an industry</option>{["Clothing & boutiques", "Online retail", "Food & hospitality", "Health & beauty", "Professional services", "Other"].map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
            {!onboarding && field("contact_email", "Business email", { placeholder: "you@business.co.zw", hint: "Optional. Used for account and contact details." })}
            {!onboarding && field("contact_phone", "Business phone", { placeholder: "+263 77 123 4567" })}
            {!onboarding && field("address", "Business location", { placeholder: "Town or area" })}
          </div>
          {onboarding && <p className="mt-5 rounded-xl bg-brand-soft/70 p-4 text-sm leading-5 text-foreground/80">That’s all you need to get started. You can add contact details, products, and reply preferences from your account later.</p>}
          {!onboarding && <div className="mt-5 grid gap-5">{field("description", "About your business", { multiline: true, placeholder: "What do you sell or help customers with?" })}{field("avatar_url", "Logo URL", { placeholder: "https://…" })}</div>}
        </section>}

        {showPreferences && <section className="rounded-2xl border bg-background p-5 sm:p-7">
          <div className="mb-6"><h2 className="text-lg font-semibold">Set your preferences</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Choose the defaults you use with customers. You can change these later.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            {([ ["currency", "Currency", ["USD", "ZWG", "ZAR", "EUR", "GBP"]], ["language", "Reply language", ["English", "Shona", "Ndebele"]] ] as const).map(([key, label, options]) => <div key={key} className="space-y-2"><Label htmlFor={key}>{label}</Label><select id={key} className="h-12 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" value={values[key]} onChange={(event) => update(key, event.target.value as BusinessInput[typeof key])}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>)}
          </div>
          <div className="mt-5">{field("operating_hours", "Business hours", { multiline: true, placeholder: "e.g. Mon–Fri, 8:00 AM–5:00 PM; Sat, 9:00 AM–1:00 PM", hint: "Helps Veylo tell customers when you’re open." })}</div>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-4"><div><Label htmlFor="notifications">Email notifications</Label><p className="mt-1 text-xs text-muted-foreground">Receive important account updates by email.</p></div><Switch id="notifications" checked={values.notifications} onCheckedChange={(checked) => update("notifications", checked)} /></div>
        </section>}

        {showKnowledge && <section className="rounded-2xl border bg-background p-5 sm:p-7">
          <div className="mb-6"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Teach Veylo about your business</h2>{onboarding && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">Optional</span>}</div><p className="mt-1 text-sm leading-5 text-muted-foreground">Add a few facts so replies can be more useful. Skip this step and add them later if you prefer.</p></div>
          <div className="grid gap-5">
            {field("products", "Products and prices", { multiline: true, placeholder: "Product name — price — sizes or options\nExample: Classic T-shirt — $15 — S, M, L", hint: "One item per line works well." })}
            {field("faqs", "Common questions and answers", { multiline: true, placeholder: "Question: Do you deliver?\nAnswer: Yes, delivery is available in Harare…" })}
            {field("delivery_policy", "Delivery and payment", { multiline: true, placeholder: "Areas you deliver to, delivery fees, and payment methods." })}
            {!onboarding && field("ai_instructions", "Extra guidance for Veylo", { multiline: true, placeholder: "Anything else Veylo should know when helping your customers?" })}
          </div>
          {onboarding && <div className="mt-5 rounded-xl bg-brand-soft/70 p-4 text-sm leading-5 text-foreground/80">You can create your workspace now and add products, FAQs, and policies later from your account.</div>}
        </section>}

        {!onboarding && <section className="rounded-2xl border bg-background p-5 sm:p-7"><h2 className="text-lg font-semibold">WhatsApp connection</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">WhatsApp is not connected yet. These IDs alone will not connect an account; access tokens are not collected here.</p><div className="mt-6 grid gap-5 sm:grid-cols-2">{field("whatsapp_phone_number_id", "Phone number ID", { placeholder: "Optional" })}{field("whatsapp_business_account_id", "Business account ID", { placeholder: "Optional" })}</div></section>}
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-brand"><Check className="h-4 w-4" />Changes saved</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <p className="text-xs text-muted-foreground">Your business information stays private.</p>
        <Button type="submit" disabled={busy} className="h-12 min-w-40 rounded-xl">{busy ? <Loader2 className="animate-spin" /> : onboarding ? <ArrowRight /> : <Save />}{onboarding ? "Create workspace" : "Save changes"}</Button>
      </div>
    </form>
  );
}
