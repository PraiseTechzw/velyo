import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { sendContactQuestion } from "@/lib/contact.functions";

const initialValues: ContactInput = { name: "", email: "", business: "", message: "", website: "" };

export function ContactSection() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInput, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const sendQuestion = useServerFn(sendContactQuestion);
  const update = (field: keyof ContactInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ContactInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ContactInput;
        nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const result = await sendQuestion({ data: parsed.data });
      setStatus(result.success ? "success" : "error");
      if (result.success) setValues(initialValues);
    } catch {
      setStatus("error");
    }
  }
  return (
    <section id="contact" className="border-y border-border bg-surface px-6 py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.25fr] md:gap-20">
        <div>
          <span className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand"><MessageCircle className="h-6 w-6" /></span>
          <p className="text-sm font-semibold text-brand">Contact us</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Let’s talk about<br />your business.</h2>
          <p className="mt-5 max-w-sm text-muted-foreground">Have a question about Veylo, our plans or getting started? Send the team a message.</p>
          <p className="mt-8 text-sm text-muted-foreground">Harare, Zimbabwe</p>
        </div>
        {status === "success" ? (
          <div role="status" className="flex min-h-96 flex-col items-start justify-center">
            <CheckCircle2 className="h-10 w-10 text-brand" />
            <h3 className="mt-5 text-2xl font-bold">Thanks for reaching out!</h3>
            <p className="mt-3 text-muted-foreground">Your question has been sent to the Veylo team.</p>
            <Button variant="outline" className="mt-6 rounded-full" onClick={() => setStatus("idle")}>Send another message</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5" aria-label="Contact Veylo">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Your name <span aria-hidden="true">*</span></Label>
                <Input id="contact-name" autoComplete="name" required maxLength={100} value={values.name} onChange={(e) => update("name", e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} className="h-12 rounded-lg bg-background" placeholder="Your full name" />
                {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email address <span aria-hidden="true">*</span></Label>
                <Input id="contact-email" type="email" autoComplete="email" required maxLength={255} value={values.email} onChange={(e) => update("email", e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className="h-12 rounded-lg bg-background" placeholder="you@business.com" />
                {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-business">Business name <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="contact-business" autoComplete="organization" maxLength={150} value={values.business} onChange={(e) => update("business", e.target.value)} className="h-12 rounded-lg bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Your question <span aria-hidden="true">*</span></Label>
              <Textarea id="contact-message" required maxLength={2000} rows={5} value={values.message} onChange={(e) => update("message", e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} className="min-h-36 resize-y rounded-lg bg-background" placeholder="How can we help?" />
              {errors.message && <p id="message-error" className="text-sm text-destructive">{errors.message}</p>}
            </div>
            <div hidden aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update("website", e.target.value)} /></div>
            {status === "error" && <p role="alert" className="text-sm text-destructive">Your message couldn’t be sent. Please try again; your question is still here.</p>}
            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={status === "sending"} className="h-12 min-w-44 rounded-full px-6 font-semibold">
                {status === "sending" ? <Loader2 className="animate-spin" /> : <Send />} {status === "sending" ? "Sending…" : "Send message"}
              </Button>
              <p className="max-w-xs text-xs text-muted-foreground">We’ll use your details only to respond to your enquiry.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}