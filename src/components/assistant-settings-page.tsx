import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  Globe2,
  Info,
  Lightbulb,
  MessageCircle,
  PackageCheck,
  Paperclip,
  Send,
  ShoppingCart,
  Smile,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getBusiness, saveAssistantSettings } from "@/lib/business.functions";
import {
  assistantSettingsSchema,
  emptyAssistantSettings,
  type AssistantSettingsInput,
} from "@/lib/assistant-schema";

const query = { queryKey: ["business"], queryFn: () => getBusiness() };
type PreviewMessage = { from: "customer" | "assistant"; text: string };
const capabilities = [
  {
    key: "answer_product_questions",
    title: "Answer product questions",
    detail: "Price, availability, features and more.",
    icon: MessageCircle,
  },
  {
    key: "provide_business_information",
    title: "Provide business information",
    detail: "Hours, location, policies, FAQs.",
    icon: FileText,
  },
  {
    key: "capture_leads",
    title: "Capture leads",
    detail: "Collect customer details and interests.",
    icon: UserRoundPlus,
  },
  {
    key: "recommend_products",
    title: "Recommend products",
    detail: "Suggest items based on customer needs.",
    icon: ShoppingCart,
  },
  {
    key: "handle_order_inquiries",
    title: "Handling order inquiries",
    detail: "Track orders and delivery status.",
    icon: PackageCheck,
  },
  {
    key: "escalate_to_human",
    title: "Escalate to human",
    detail: "For complex or sensitive issues.",
    icon: UserRound,
  },
] as const;

export function AssistantSettingsPage() {
  const { data } = useSuspenseQuery(query);
  const queryClient = useQueryClient();
  const save = useServerFn(saveAssistantSettings);
  const business = data.business;
  const initial = useMemo(() => {
    if (!business) return emptyAssistantSettings("Business");
    return assistantSettingsSchema.parse({ ...emptyAssistantSettings(business.name), ...business });
  }, [business]);
  const [values, setValues] = useState<AssistantSettingsInput>(initial);
  const [savedValues, setSavedValues] = useState<AssistantSettingsInput>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewInput, setPreviewInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const dirty = JSON.stringify(values) !== JSON.stringify(savedValues);

  if (!business) return null;
  const product = business.products
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  const productTitle = product?.split(/\s+[—–-]\s+/)[0] || "Product example";
  const productPrice =
    product?.match(/(?:\$|USD\s*)\s?\d+(?:\.\d{1,2})?/)?.[0] || "Price not listed";
  const knowledgeCounts = [
    { title: "Products & Services", count: countEntries(business.products), icon: PackageCheck },
    { title: "FAQs", count: countEntries(business.faqs), icon: CircleHelp },
    { title: "Policies", count: countEntries(business.delivery_policy), icon: ClipboardList },
    {
      title: "Business Info",
      count: [
        business.description,
        business.industry,
        business.address,
        business.operating_hours,
        business.contact_phone,
        business.website,
      ].filter(Boolean).length,
      icon: Info,
    },
  ];

  function update<K extends keyof AssistantSettingsInput>(
    key: K,
    value: AssistantSettingsInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = assistantSettingsSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${String(issue?.path[0] ?? "Settings")}: ${issue?.message ?? "Check this value."}`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await save({ data: parsed.data });
      await queryClient.invalidateQueries({ queryKey: ["business"] });
      setValues(parsed.data);
      setSavedValues(parsed.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assistant settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function testPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = previewInput.trim();
    if (!question) return;
    setPreviewMessages((messages) => [
      ...messages,
      { from: "customer", text: question },
      { from: "assistant", text: values.assistant_fallback_message },
    ]);
    setPreviewInput("");
  }

  return (
    <div className="grid items-start gap-3 2xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
      <form onSubmit={submit} className="min-w-0 space-y-3">
        <header className="flex flex-wrap items-start justify-between gap-4 px-2 py-1">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#e4f8ef] text-[#009b59]">
              <Bot className="h-10 w-10" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#102b45]">AI Assistant</h1>
              <p className="mt-1 max-w-xl text-sm leading-5 text-[#7188a5]">
                Configure how your AI assistant responds to customers, uses your business
                information and handles conversations.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5de] px-3 py-1.5 text-[11px] font-medium text-[#946411]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e7a928]" />
            AI not connected
          </span>
        </header>

        <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)] md:p-5">
          <h2 className="text-sm font-semibold text-[#102b45]">Assistant Details</h2>
          <div className="mt-3 grid gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Assistant name" required>
              <Input
                value={values.assistant_name}
                maxLength={50}
                required
                onChange={(event) => update("assistant_name", event.target.value)}
                className="h-10 border-[#dce5ed] text-xs"
              />
              <p className="mt-0.5 text-right text-[9px] text-[#8ba0b9]">
                {values.assistant_name.length}/50
              </p>
            </Field>
            <Field label="Tone of voice">
              <div className="relative">
                <Smile className="absolute left-3 top-3 h-4 w-4 text-[#52708f]" />
                <select
                  value={values.assistant_tone}
                  onChange={(event) =>
                    update(
                      "assistant_tone",
                      event.target.value as AssistantSettingsInput["assistant_tone"],
                    )
                  }
                  className="h-10 w-full appearance-none rounded-lg border border-[#dce5ed] bg-white pl-10 pr-9 text-xs text-[#173a5b] outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {["Friendly & Professional", "Professional", "Warm & Casual", "Concise"].map(
                    (tone) => (
                      <option key={tone}>{tone}</option>
                    ),
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#52708f]" />
              </div>
            </Field>
            <Field label="Language">
              <div className="relative">
                <Globe2 className="absolute left-3 top-3 h-4 w-4 text-[#52708f]" />
                <select
                  value={values.assistant_language}
                  onChange={(event) =>
                    update(
                      "assistant_language",
                      event.target.value as AssistantSettingsInput["assistant_language"],
                    )
                  }
                  className="h-10 w-full appearance-none rounded-lg border border-[#dce5ed] bg-white pl-10 pr-9 text-xs text-[#173a5b] outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {["English (US)", "English (UK)", "Shona", "Ndebele"].map((language) => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#52708f]" />
              </div>
            </Field>
            <Field label="Fallback message">
              <Textarea
                value={values.assistant_fallback_message}
                maxLength={200}
                onChange={(event) => update("assistant_fallback_message", event.target.value)}
                className="min-h-[70px] resize-none border-[#dce5ed] text-xs"
              />
              <p className="mt-0.5 text-right text-[9px] text-[#8ba0b9]">
                {values.assistant_fallback_message.length}/200
              </p>
            </Field>
          </div>

          <div className="mt-4 border-t border-[#edf1f4] pt-3">
            <h2 className="text-sm font-semibold text-[#102b45]">AI Capabilities</h2>
            <p className="mt-1 text-[11px] text-[#7188a5]">
              Enable what your assistant can do. You can adjust these anytime.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {capabilities.map(({ key, title, detail, icon: Icon }) => (
                <div
                  key={key}
                  className="flex min-h-[62px] items-center gap-3 rounded-xl border border-[#e5edf1] px-3 py-2"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e4f8ef] text-[#087b59]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-[#173a5b]">{title}</p>
                    <p className="mt-1 truncate text-[9px] text-[#8298b3]">{detail}</p>
                  </div>
                  <Switch
                    aria-label={title}
                    checked={values[key]}
                    onCheckedChange={(checked) => update(key, checked)}
                    className="scale-90 data-[state=checked]:bg-[#00a65a]"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)] md:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#102b45]">Knowledge Base</h2>
              <p className="mt-1 text-[11px] text-[#7188a5]">
                Add information your AI assistant can use to answer questions.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 border-[#dbe4ed] text-[10px]"
            >
              <Link to="/account">
                <BookOpen className="h-3.5 w-3.5" />
                Manage knowledge
              </Link>
            </Button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {knowledgeCounts.map(({ title, count, icon: Icon }) => (
              <Link
                key={title}
                to="/account"
                className="flex min-h-[54px] items-center gap-2 rounded-xl border border-[#e4ebf0] px-3 py-2 hover:bg-[#f8fcfa]"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#173a5b]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium text-[#173a5b]">{title}</p>
                  <p className="text-[9px] text-[#8298b3]">
                    {count} {count === 1 ? "item" : "items"}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-[#8ba0b9]" />
              </Link>
            ))}
          </div>
        </section>
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || busy}
            onClick={() => {
              setValues(savedValues);
              setError("");
            }}
            className="h-9 border-[#dbe4ed] text-xs"
          >
            Discard
          </Button>
          <Button
            type="submit"
            disabled={busy || !dirty}
            className="h-9 bg-[#00a760] px-5 text-xs text-white hover:bg-[#009451]"
          >
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <aside className="space-y-3">
        <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
          <h2 className="text-sm font-semibold text-[#102b45]">Quick Preview</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#e7edf1] bg-[#faf9f6]">
            <div className="flex items-center gap-3 border-b bg-white px-3 py-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#00a65a] text-white">
                <Bot className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#102b45]">
                  {values.assistant_name}
                </p>
                <p className="text-[10px] text-[#7188a5]">Example preview</p>
              </div>
              <span className="text-[#8298b3]">⋮</span>
            </div>
            <div className="min-h-[380px] space-y-2 bg-[radial-gradient(#e8eee9_0.7px,transparent_0.7px)] bg-[size:12px_12px] p-3">
              <Bubble from="assistant">
                Hi 👋 Welcome to {business.name}. How can I help you today?
              </Bubble>
              <Bubble from="customer">Do you have the latest products in stock?</Bubble>
              <Bubble from="assistant">
                {product
                  ? `Here is one of our products: ${productTitle}. ${productPrice}.`
                  : "I can help with products, services, and business information once those details are added to the knowledge base."}
                {product && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border bg-white p-2">
                    <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eff5f2] text-[#45836b]">
                      <ShoppingCart className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-medium">{productTitle}</span>
                      <span className="text-[10px] text-[#008f57]">{productPrice}</span>
                    </span>
                  </div>
                )}
              </Bubble>
              {previewMessages.map((message, index) => (
                <Bubble key={`${index}-${message.from}`} from={message.from}>
                  {message.text}
                </Bubble>
              ))}
              <p className="pt-1 text-center text-[9px] font-medium text-[#7188a5]">
                SAMPLE PREVIEW · NO MESSAGES SENT
              </p>
            </div>
            <div className="flex items-center gap-2 border-t bg-white px-3 py-2">
              <Smile className="h-4 w-4 text-[#7188a5]" />
              <span className="flex-1 text-[10px] text-[#8ba0b9]">
                Preview messages are not sent
              </span>
              <Paperclip className="h-4 w-4 text-[#7188a5]" />
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#00a65a] text-white">
                <Send className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-[#e4ebf0] bg-white p-4 shadow-[0_8px_25px_rgba(24,48,71,0.035)]">
          <h2 className="text-sm font-semibold text-[#102b45]">Test the AI Assistant</h2>
          <p className="mt-1 text-[10px] text-[#7188a5]">
            Try the configured fallback in a local preview.
          </p>
          <form onSubmit={testPreview} className="mt-3 flex gap-2">
            <Input
              aria-label="Ask a preview question"
              value={previewInput}
              onChange={(event) => setPreviewInput(event.target.value)}
              placeholder="Ask a question…"
              className="h-9 min-w-0 border-[#dbe4ed] text-[10px]"
            />
            <Button
              type="submit"
              disabled={!previewInput.trim()}
              className="h-9 bg-[#00a760] px-4 text-[10px] text-white hover:bg-[#009451]"
            >
              Send
            </Button>
          </form>
          <p className="mt-2 text-[9px] text-[#8298b3]">
            Preview only. The assistant AI service is not connected, and no message is sent.
          </p>
        </section>
      </aside>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dcefe5] bg-gradient-to-r from-[#effaf4] to-[#f8fcf9] px-5 py-3 2xl:col-span-2">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dcf7eb] text-[#00a65a]">
            <Lightbulb className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#174838]">Need help?</p>
            <p className="mt-1 text-[10px] text-[#7188a5]">
              Check our AI assistant guide or contact support for assistance with advanced
              configuration.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 border-[#dbe4ed] text-[11px]">
            <Link to="/help">View documentation</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 bg-[#00a760] text-[11px] text-white hover:bg-[#009451]"
          >
            <Link to="/help">Contact support</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-[10px] font-medium text-[#36516f]">
        {label}
        {required && <span className="ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
function Bubble({ from, children }: { from: PreviewMessage["from"]; children: ReactNode }) {
  return (
    <div
      className={`max-w-[88%] rounded-xl px-3 py-2 text-[10px] leading-4 shadow-sm ${from === "assistant" ? "rounded-tl-sm bg-white text-[#173a5b]" : "ml-auto rounded-tr-sm bg-[#dcf9e1] text-[#173a5b]"}`}
    >
      {children}
      <p className="mt-1 text-right text-[8px] text-[#8ba0b9]">
        {from === "assistant" ? "Sample reply" : "Preview question"}
      </p>
    </div>
  );
}
function countEntries(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}
