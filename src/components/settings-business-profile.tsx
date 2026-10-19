import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CircleDollarSign, Clock3, Eye, Link2, LoaderCircle, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { businessSchema, emptyBusiness, type BusinessInput } from "@/lib/business-schema";
import { saveBusiness, updateBusinessVisibility } from "@/lib/business.functions";
import mark from "@/assets/veylo-mark.png";

const fieldClass = "h-11 rounded-lg border-border bg-background px-3 shadow-none focus-visible:ring-brand/30";
const selectClass = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-brand/30";
const industryOptions = ["Online retail", "Clothing & boutiques", "Food & hospitality", "Health & beauty", "Professional services", "Other"];
const countryOptions = ["Zimbabwe", "South Africa", "Zambia", "Botswana", "Other"];
const timezones = ["Africa/Harare", "Africa/Johannesburg", "Africa/Lusaka", "Africa/Gaborone", "UTC"];
const currencies = ["USD", "ZWG", "ZAR", "EUR", "GBP"];

type Hours = { weekdays: string; weekdayOpen: string; weekdayClose: string; saturday: string; saturdayOpen: string; saturdayClose: string };
const defaultHours: Hours = { weekdays: "Mon – Fri", weekdayOpen: "08:00", weekdayClose: "18:00", saturday: "Sat", saturdayOpen: "09:00", saturdayClose: "15:00" };
function parseHours(value: string): Hours {
  const match = value.match(/^([^,;]+),\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})(?:;\s*([^,;]+),\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2}))?$/);
  if (!match) return { ...defaultHours };
  return { weekdays: match[1].trim(), weekdayOpen: match[2], weekdayClose: match[3], saturday: match[4]?.trim() || "Sat", saturdayOpen: match[5] || "09:00", saturdayClose: match[6] || "15:00" };
}
function serializeHours(value: Hours) {
  const parts = [`${value.weekdays}, ${value.weekdayOpen} – ${value.weekdayClose}`];
  if (value.saturday !== "Closed") parts.push(`${value.saturday}, ${value.saturdayOpen} – ${value.saturdayClose}`);
  return parts.join("; ");
}

export function SettingsBusinessProfile({
  business,
  profile,
}: {
  business: object;
  profile: { display_name: string | null; avatar_url: string | null };
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveBusiness);
  const setVisibility = useServerFn(updateBusinessVisibility);
  const fileInput = useRef<HTMLInputElement>(null);
  const businessData = business as Record<string, unknown>;
  const [values, setValues] = useState<BusinessInput>(() => businessSchema.parse({ ...emptyBusiness, ...businessData, display_name: profile.display_name ?? "", avatar_url: profile.avatar_url ?? "" }));
  const [savedValues, setSavedValues] = useState(values);
  const [hours, setHours] = useState(() => parseHours(String(businessData.operating_hours ?? "")));
  const [savedHours, setSavedHours] = useState(hours);
  const [hoursTouched, setHoursTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visible, setVisible] = useState(Boolean(businessData.profile_visible ?? true));

  useEffect(() => {
    const next = businessSchema.parse({ ...emptyBusiness, ...(business as Record<string, unknown>), display_name: profile.display_name ?? "", avatar_url: profile.avatar_url ?? "" });
    const nextHours = parseHours(String((business as Record<string, unknown>).operating_hours ?? ""));
    setValues(next);
    setSavedValues(next);
    setHours(nextHours);
    setSavedHours(nextHours);
    setHoursTouched(false);
    setVisible(Boolean((business as Record<string, unknown>).profile_visible ?? true));
  }, [business, profile]);

  function update<K extends keyof BusinessInput>(key: K, value: BusinessInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }
  function updateHours<K extends keyof Hours>(key: K, value: Hours[K]) {
    setHours((current) => ({ ...current, [key]: value }));
    setHoursTouched(true);
    setError("");
  }

  async function changeLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG or JPG image that is no larger than 2 MB.");
      return;
    }
    setLogoBusy(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in again before changing your business logo.");
      const extension = file.type === "image/png" ? "png" : "jpg";
      const path = `${authData.user.id}/business-logo.${extension}`;
      const { error: uploadError } = await supabase.storage.from("business-logos").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data: image } = supabase.storage.from("business-logos").getPublicUrl(path);
      update("avatar_url", image.publicUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The business logo could not be uploaded.");
    } finally {
      setLogoBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { ...values, operating_hours: hoursTouched ? serializeHours(hours) : values.operating_hours };
    const parsed = businessSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const label = String(issue?.path[0] ?? "Details").replaceAll("_", " ");
      setError(`${label.charAt(0).toUpperCase()}${label.slice(1)}: ${issue?.message ?? "Check this value."}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({ data: parsed.data });
      await queryClient.invalidateQueries({ queryKey: ["business"] });
      setValues(parsed.data);
      setSavedValues(parsed.data);
      setHoursTouched(false);
      setSavedHours(hours);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your business profile could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(next: boolean) {
    setVisibilityBusy(true);
    setError("");
    try {
      await setVisibility({ data: { visible: next } });
      setVisible(next);
      await queryClient.invalidateQueries({ queryKey: ["business"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Business profile visibility could not be saved.");
    } finally {
      setVisibilityBusy(false);
    }
  }

  function textField(key: keyof BusinessInput, label: string, opts: { required?: boolean; type?: string; placeholder?: string; icon?: typeof Mail } = {}) {
    const Icon = opts.icon;
    return <Field id={`settings-${key}`} label={label} required={opts.required} key={key}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#526d8c]" />}
        <Input id={`settings-${key}`} className={`${fieldClass} ${Icon ? "pl-9" : ""}`} type={opts.type ?? "text"} value={String(values[key])} placeholder={opts.placeholder} required={opts.required} maxLength={key === "name" ? 120 : undefined} onChange={(event) => update(key, event.target.value as BusinessInput[typeof key])} />
      </div>
    </Field>;
  }
  function selectField<K extends "industry" | "country" | "currency" | "timezone">(key: K, label: string, options: readonly string[], required = false, icon?: typeof Mail) {
    const Icon = icon;
    return <Field id={`settings-${key}`} label={label} required={required} key={key}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#526d8c]" />}
        <select id={`settings-${key}`} className={`${selectClass} ${Icon ? "pl-9" : ""}`} value={values[key]} required={required} onChange={(event) => update(key, event.target.value as BusinessInput[K])}>
          {key === "industry" && <option value="">Choose an industry</option>}
          {options.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </div>
    </Field>;
  }
  function timeRange(id: string, open: string, close: string, setOpen: (value: string) => void, setClose: (value: string) => void) {
    return <div className="flex h-11 min-w-0 items-center gap-1 rounded-lg border border-[#dbe4ed] bg-background px-2.5">
      <Clock3 className="h-4 w-4 shrink-0 text-[#526d8c]" />
      <input id={id} type="time" value={open} onChange={(event) => setOpen(event.target.value)} aria-label="Opening time" className="min-w-0 flex-1 bg-transparent text-xs text-[#294766] outline-none" />
      <span className="text-xs text-[#8298b3]">–</span>
      <input type="time" value={close} onChange={(event) => setClose(event.target.value)} aria-label="Closing time" className="min-w-0 flex-1 bg-transparent text-xs text-[#294766] outline-none" />
    </div>;
  }

  return <>
    <form onSubmit={submit} className="rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_10px_30px_rgba(24,48,71,0.04)] md:p-6">
      <div>
        <h2 className="text-[21px] font-semibold tracking-tight text-[#18324b]">Business Profile</h2>
        <p className="mt-0.5 text-sm text-[#7188a5]">Update your business information and preferences.</p>
      </div>
      <div className="mt-6 grid gap-x-5 gap-y-4 xl:grid-cols-[minmax(250px,0.8fr)_repeat(2,minmax(0,1fr))]">
        <div className="xl:row-span-2">
          <span className="mb-2 block text-xs font-medium text-[#526d8c]">Business logo</span>
          <div className="flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#078d45]">
              <img src={values.avatar_url || mark} alt="Business logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] leading-4 text-[#8298b3]">Recommended size: 512 × 512<br />PNG or JPG, max 2MB</p>
              <input ref={fileInput} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={changeLogo} aria-label="Choose business logo" />
              <Button type="button" variant="outline" size="sm" disabled={logoBusy} onClick={() => fileInput.current?.click()} className="mt-1 h-8 border-[#dbe4ed] text-xs text-[#294766]">
                {logoBusy ? <LoaderCircle className="animate-spin" /> : <Pencil />} Change logo
              </Button>
            </div>
          </div>
        </div>
        {textField("name", "Business name", { required: true })}
        {selectField("industry", "Industry", industryOptions, true)}
        <Field id="settings-description" label="Business description" required className="xl:col-span-2">
          <Textarea id="settings-description" maxLength={500} className="min-h-[82px] resize-y rounded-lg border-border px-3 py-2 shadow-none focus-visible:ring-brand/30" value={values.description} required placeholder="What do you sell or help customers with?" onChange={(event) => update("description", event.target.value)} />
          <span className="mt-0.5 block text-right text-[11px] text-[#8298b3]">{values.description.length}/500</span>
        </Field>
        {textField("contact_email", "Business email", { required: true, type: "email", placeholder: "you@business.co.zw", icon: Mail })}
        {textField("contact_phone", "Phone", { required: true, placeholder: "+263 77 123 4567", icon: Phone })}
        {textField("website", "Website", { type: "url", placeholder: "https://example.co.zw", icon: Link2 })}
        {selectField("country", "Country", countryOptions, true, MapPin)}
        {selectField("currency", "Currency", currencies, true, CircleDollarSign)}
        {selectField("timezone", "Timezone", timezones, true, Clock3)}
        <Field id="settings-weekdays" label={<span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Business hours</span>} className="xl:col-span-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
              <select id="settings-weekdays" className={selectClass} value={hours.weekdays} onChange={(event) => updateHours("weekdays", event.target.value)}>{["Mon – Fri", "Mon – Sat", "Mon – Sun", "Mon – Thu", "Tue – Sat"].map((day) => <option key={day}>{day}</option>)}</select>
              {timeRange("settings-weekday-open", hours.weekdayOpen, hours.weekdayClose, (value) => updateHours("weekdayOpen", value), (value) => updateHours("weekdayClose", value))}
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
              <select aria-label="Saturday business hours day" className={selectClass} value={hours.saturday} onChange={(event) => updateHours("saturday", event.target.value)}>{["Sat", "Sun", "Closed"].map((day) => <option key={day}>{day}</option>)}</select>
              {timeRange("settings-saturday-open", hours.saturdayOpen, hours.saturdayClose, (value) => updateHours("saturdayOpen", value), (value) => updateHours("saturdayClose", value))}
            </div>
          </div>
        </Field>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-transparent pt-0">
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setValues(savedValues); setHours(savedHours); setHoursTouched(false); setError(""); }} className="min-w-24 border-[#dbe4ed] text-[#294766]">Discard</Button>
        <Button type="submit" disabled={busy} className="min-w-36 bg-[#9aeb35] text-[#17334a] hover:bg-[#8ddd28]">
          {busy ? <><LoaderCircle className="animate-spin" /> Saving…</> : "Save changes"}
        </Button>
      </div>
    </form>
    <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#e4eaf0] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(24,48,71,0.04)] md:px-6">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e9f7f0] text-[#009746]"><Eye className="h-6 w-6" /></span>
        <div><p className="text-sm font-semibold text-[#18324b]">Business profile visibility</p><p className="mt-0.5 text-sm text-[#8298b3]">Used to personalize AI replies and customer experiences.</p></div>
      </div>
      <Switch aria-label="Business profile visibility" checked={visible} disabled={visibilityBusy} onCheckedChange={toggleVisibility} />
    </div>
  </>;
}

function Field({ id, label, required, className, children }: { id?: string; label: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return <div className={`min-w-0 ${className ?? ""}`}>
    <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-[#526d8c]">{label}{required && <span className="ml-1 text-[#6a84a0]" aria-hidden="true">*</span>}</label>
    {children}
  </div>;
}
