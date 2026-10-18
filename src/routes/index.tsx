import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, useReveal } from "@/components/site-header";
import {
  Check, Calendar, Users, BookOpen, Store, Truck, Stethoscope, Rocket, ArrowRight,
  Facebook, Linkedin, Youtube, Instagram, Headphones, Sparkles, Hexagon, Triangle, Circle, Square, Diamond,
} from "lucide-react";
import heroPhone from "@/assets/hero-hand.jpg";
import womanPhone from "@/assets/woman-phone.png";
import booking from "@/assets/booking.jpg";
import support from "@/assets/support.jpg";
import knowledge from "@/assets/knowledge.jpg";
import clinic from "@/assets/clothing.jpg";
import realestate from "@/assets/onlinestore.jpg";
import veyloMarkWhite from "@/assets/veylo-mark-white.png";
import { ContactSection } from "@/components/contact-section";
import { FaqSection } from "@/components/faq-section";
import { WhatsAppIcon as MessageCircle } from "@/components/whatsapp-icon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veylo — WhatsApp sales & support automation for Zimbabwe" },
      { name: "description", content: "AI that answers customer enquiries, captures leads and follows up on sales for Zimbabwean shops — all from one dashboard." },
      { property: "og:title", content: "Veylo — WhatsApp sales & support automation for Zimbabwe" },
      { property: "og:description", content: "AI that answers customer enquiries, captures leads and follows up on sales for Zimbabwean businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const btn = "btn-base inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-brand">{children}</p>;
}

function Ticks({ items, pill }: { items: string[]; pill?: boolean }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((i) => (
        <li key={i} className={`flex items-center gap-3 text-sm text-foreground/80 ${pill ? "w-fit rounded-full border glass px-4 py-2 shadow-sm" : ""}`}>
          <Check className="h-4 w-4 shrink-0 text-brand" />
          {i}
        </li>
      ))}
    </ul>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={`absolute grid h-12 w-12 place-items-center rounded-2xl glass text-brand shadow-xl ${className}`}>{children}</div>;
}

function Bubble({ className, children, me }: { className: string; children: React.ReactNode; me?: boolean }) {
  return <div className={`absolute max-w-[11rem] rounded-2xl px-3 py-2 text-xs shadow-lg ${me ? "bg-brand-soft" : "glass"} ${className}`}>{children}</div>;
}

function Index() {
  useReveal();
  return (
    <div id="top" className="page-glow min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6">
        <div className="relative">
          <div className="hero-grad relative grid min-h-[560px] overflow-hidden rounded-[2.5rem] rounded-bl-none px-6 pb-40 pt-14 sm:px-8 md:grid-cols-2 md:px-16 md:pt-24">
            <div className="relative z-10 text-primary-foreground">
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Turn WhatsApp<br />Chats Into<br /><span className="text-sun">Sales</span>
              </h1>
              <p className="mt-6 max-w-md opacity-90">AI that answers customer enquiries, captures leads and follows up on sales for Zimbabwean shops — automatically, on WhatsApp.</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild className={`${btn} h-auto bg-brand-soft text-brand hover:bg-brand-soft`}><Link to="/auth" search={{ mode: "signup" }}>Start free trial <ArrowRight className="h-4 w-4" /></Link></Button>
                <a href="#demos" className={`${btn} bg-background text-foreground`}>Try a WhatsApp demo</a>
              </div>
            </div>
            <img src={heroPhone} alt="Hand holding a phone with a WhatsApp shop chat" width={1024} height={1152} className="hero-fade absolute bottom-0 right-0 hidden h-full sm:block w-auto max-w-[60%] object-cover object-left" />
            {/* decorative design */}
            <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border-[40px] border-primary-foreground/5" />
            <div className="pointer-events-none absolute left-1/3 top-10 h-40 w-40 rounded-full border border-dashed border-primary-foreground/20" />
            <div className="pointer-events-none absolute bottom-32 left-[45%] h-3 w-3 rounded-full bg-sun" />
            <div className="pointer-events-none absolute right-[42%] top-24 h-2 w-2 rounded-full bg-primary-foreground/60" />
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-10" viewBox="0 0 1200 560" preserveAspectRatio="none"><path d="M0 420 C 300 300, 500 560, 800 380 S 1200 300, 1200 300" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground" /><path d="M0 470 C 300 350, 500 610, 800 430 S 1200 350, 1200 350" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground" /></svg>
            <div className="float absolute right-[38%] top-1/3 z-10 hidden rounded-2xl glass px-4 py-3 text-xs font-semibold text-foreground shadow-xl md:block">⚡ Replied in 2s</div>
            <div className="float absolute bottom-40 right-8 z-10 hidden rounded-2xl glass px-4 py-3 text-xs font-semibold text-foreground shadow-xl md:block" style={{ animationDelay: "1.5s" }}>🛍️ New lead captured</div>
          </div>
          {/* notch with agent chips */}
          <div className="relative -mt-32 flex w-fit flex-wrap gap-4 rounded-tr-[2.5rem] bg-background pr-6 pt-6">
            {[[Headphones, "Customer", "Support"], [Sparkles, "Lead", "Capture"], [Calendar, "Sales", "Follow-ups"]].map(([I, a, b]: any) => (
              <div key={a} className="w-36 rounded-2xl glass-soft p-4 text-sm font-semibold">
                <I className="mb-3 h-5 w-5 text-brand" />{a}<br />{b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who */}
      <section data-reveal id="industry" className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        <p className="text-sm font-semibold tracking-widest text-destructive">WHO IT'S FOR</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Built for Zimbabwean businesses that sell on WhatsApp</h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[[Store, "Clothing shops &", "boutiques"], [Truck, "Online retailers &", "delivery stores"], [Users, "Small & medium", "businesses"], [Rocket, "Growing African", "brands"]].map(([I, a, b]: any) => (
            <div key={a} className="lift rounded-3xl glass-soft p-7 text-left">
              <span className="grid h-10 w-10 place-items-center rounded-xl glass shadow-sm"><I className="h-5 w-5 text-destructive" /></span>
              <p className="mt-8 font-semibold">{a}<br />{b}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-lg font-semibold">Too many messages, not enough staff? Veylo <span className="text-brand">replies for you !</span></p>
      </section>

      {/* Two ways */}
      <section data-reveal id="pricing" className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2.5rem] glass-soft px-6 py-20 text-center md:px-16">
          <Eyebrow>Simple monthly subscriptions</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">Pay Monthly For The Features And Usage Your Business Needs.</h2>
          <div className="mt-14 grid items-start gap-8 text-left md:grid-cols-2">
            {[
              { tag: "For shops getting started", name: "Veylo Starter", sub: "Automatic answers to your most common customer enquiries.", items: ["Instant replies on prices, sizes & stock", "Delivery & payment info (EcoCash, cash, swipe)", "Capture every new customer", "Available 24/7, even after hours"], best: ["Clothing shops", "Boutiques", "Small retailers"], cta: "Start with Starter", c: "bg-primary", t: "text-brand", lift: "md:mt-10" },
              { tag: "For growing sales teams", name: "Veylo Growth", sub: "Turn conversations into sales with leads and follow-ups.", items: ["Everything in Starter", "Organise all chats in one dashboard", "Track and manage sales leads", "Automatic follow-ups on opportunities"], best: ["Online retailers", "Multi-staff shops", "SMEs"], cta: "Choose Growth", c: "bg-primary", t: "text-destructive", lift: "" },
            ].map((p) => (
              <div key={p.name} className={`lift rounded-[2rem] glass p-8 md:p-10 ${p.lift}`}>
                <p className={`text-xs font-semibold ${p.t}`}>{p.tag}</p>
                <h3 className="mt-2 text-2xl font-bold">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.sub}</p>
                <Ticks items={p.items} />
                <p className="mt-8 text-sm font-semibold">Best for:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.best.map((b) => <span key={b} className="rounded-full border px-4 py-1.5 text-xs">{b}</span>)}
                </div>
                <div className="text-center"><Button asChild className={`${btn} mt-10 h-auto ${p.c} text-primary-foreground`}><Link to="/auth" search={{ mode: "signup" }}>{p.cta}</Link></Button></div>
              </div>
            ))}
          </div>
          <label className="mt-12 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <input type="checkbox" className="accent-[var(--brand)]" />
            No contracts. Upgrade, downgrade or cancel any month.
          </label>
        </div>
      </section>

      {/* Logos */}
      <section data-reveal className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6 py-16 text-muted-foreground">
        {[[Hexagon, "Logoipsum"], [Triangle, "Logoipsum"], [Circle, "LOGOIPSUM"], [Square, "logoipsum"], [Diamond, "Logoipsum"]].map(([I, n]: any, i) => (
          <div key={i} className="flex items-center gap-2 text-lg font-bold opacity-60"><I className="h-6 w-6" />{n}</div>
        ))}
      </section>

      {/* Yellow banner */}
      <section data-reveal className="mx-auto max-w-7xl px-6 pb-28">
        <div className="relative grid items-end overflow-hidden rounded-[2.5rem] bg-sun px-6 pt-14 sm:px-10 md:grid-cols-2 md:px-16">
          <div className="pb-16 self-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-navy md:text-5xl">No New App.<br />No Complex Software.<br /><span className="font-extrabold">Just Your WhatsApp,<br />Selling For You.</span></h2>
            <a href="#features" className={`${btn} mt-10 border border-navy text-navy hover:bg-navy hover:text-sun`}>Learn more</a>
          </div>
          <img src={womanPhone} alt="Woman smiling at her phone" loading="lazy" width={1024} height={1024} className="w-full max-w-md justify-self-center" />
          <div className="absolute right-8 top-8 grid h-16 w-16 place-items-center rounded-full bg-brand text-primary-foreground shadow-xl"><MessageCircle className="h-8 w-8" /></div>
        </div>
      </section>

      {/* Features */}
      <section data-reveal id="features" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-widest text-destructive">DISCOVER OUR FEATURES</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">What Veylo helps you do ?</h2>
        </div>

        <div className="mt-20 space-y-28">
          {/* 1 */}
          <Feature n="1" title={<>Answer Enquiries<br />Automatically</>} desc="Veylo replies to questions like:" items={["“Do you have this in size M?”", "“How much is delivery to Bulawayo?”", "“Do you accept EcoCash?”"]} pill>
            <div className="relative aspect-[4/3] rounded-[2rem] bg-navy">
              <img src={womanPhone} alt="Customer chatting" loading="lazy" width={1024} height={1024} className="absolute bottom-0 right-6 h-[95%] w-auto" />
              <Bubble className="left-6 top-6">Hi, how much is the blue dress?</Bubble>
              <Bubble me className="left-6 top-28">It’s $25 and available in S, M & L 😊</Bubble>
              <Bubble className="left-6 top-48">Great, do you deliver to Avondale?</Bubble>
              <span className="absolute bottom-6 left-6 rounded-full bg-brand px-3 py-1 text-xs text-primary-foreground">Typing…</span>
            </div>
          </Feature>
          {/* 2 */}
          <Feature n="2" reverse title={<>Capture & Manage<br />Sales Leads</>} desc="Every interested customer is saved — nobody slips through." items={["Save names & numbers automatically", "Tag leads by product & interest", "See which leads are ready to buy"]}>
            <div className="zoom-img relative rounded-[2rem]">
              <img src={booking} alt="Team managing bookings" loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
              <Badge className="-right-4 top-10"><Calendar className="h-6 w-6" /></Badge>
              <Badge className="bottom-8 left-1/2"><MessageCircle className="h-6 w-6" /></Badge>
            </div>
          </Feature>
          {/* 3 */}
          <Feature n="3" title={<>Organise Every<br />Conversation</>} desc="All your WhatsApp chats in one central dashboard." items={["One inbox for your whole team", "Hand over to a person anytime", "Never lose a message again"]}>
            <div className="zoom-img relative rounded-[2rem]">
              <img src={support} alt="Support team" loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
              <Badge className="left-6 top-1/2"><Headphones className="h-6 w-6" /></Badge>
              <Badge className="-bottom-5 left-1/2"><MessageCircle className="h-6 w-6" /></Badge>
            </div>
          </Feature>
          {/* 4 */}
          <Feature n="4" reverse title={<>Follow Up &<br />Close More Sales</>} desc="Veylo reminds customers who showed interest — so you sell more." items={["Automatic follow-up messages", "New stock & promo alerts", "Answers only from your product list"]}>
            <div className="zoom-img relative rounded-[2rem]">
              <img src={knowledge} alt="AI knowledge base" loading="lazy" width={1024} height={768} className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
              <span className="absolute bottom-10 left-8 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">Data synced ✓</span>
            </div>
          </Feature>
        </div>
      </section>

      {/* How */}
      <section data-reveal id="how" className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2.5rem] rounded-bl-none bg-navy px-6 py-16 text-primary-foreground sm:px-10 md:py-20">
          <h2 className="text-center text-3xl font-bold">How it works ?</h2>
          <div className="relative mt-16 grid gap-12 md:grid-cols-3">
            <div className="absolute left-[8%] right-[8%] top-5 hidden border-t border-dashed border-primary-foreground/30 md:block" />
            {[["Connect your", "WhatsApp number"], ["Add your products,", "prices & FAQs"], ["Go live and", "start selling"]].map(([a, b], i) => (
              <div key={a} className={`relative ${i === 1 ? "md:text-center" : i === 2 ? "md:text-right" : ""}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-full bg-brand font-bold ${i === 1 ? "md:mx-auto" : i === 2 ? "md:ml-auto" : ""}`}>{i + 1}</div>
                <p className="mt-6 font-semibold">{a}<br />{b}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap justify-center gap-10 text-sm opacity-80">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> People start chatting immediately.</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" /> Leads and chats are organised in one dashboard.</span>
          </div>
          <div className="text-center"><a href="#demos" className={`${btn} mt-10 border border-brand text-brand hover:bg-brand hover:text-primary-foreground`}>See live demos</a></div>
        </div>
      </section>

      {/* Demos */}
      <section data-reveal id="demos" className="mx-auto max-w-6xl px-6 py-20 md:py-28 text-center">
        <Eyebrow>Live Demos</Eyebrow>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">The Best Way To Understand<br />Veylo Is To Try It.</h2>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {[["Message a demo", "clothing shop on WhatsApp", clinic], ["Message a demo", "online store", realestate]].map(([a, b, img]) => (
            <div key={b} className="lift zoom-img rounded-[2rem] glass-soft p-6 md:p-8">
              <p className="text-lg font-medium">{a}<br />{b}</p>
              <img src={img} alt={b} loading="lazy" width={1024} height={640} className="mx-auto mt-6 aspect-[16/10] w-4/5 rounded-2xl object-cover" />
              <a href="#start" className={`${btn} mt-8 bg-brand-soft text-brand`}>Try it now <ArrowRight className="h-4 w-4" /></a>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">See how the AI answers customers — and how shops manage leads behind the scenes.</p>
      </section>

      {/* CTA */}
      <section data-reveal id="start" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="hero-grad relative rounded-[2.5rem] px-6 py-12 text-primary-foreground sm:px-10 md:px-14 md:py-14">
            <h2 className="text-3xl font-bold">Get started with Veylo</h2>
            <ul className="mt-6 space-y-2 opacity-90">
              <li>→ Try a live WhatsApp demo</li><li>→ Go live in days, not months</li><li>→ Simple monthly plans in USD</li>
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#demos" className={`${btn} bg-background text-foreground`}>Start a WhatsApp demo <ArrowRight className="h-4 w-4" /></a>
              <a href="#pricing" className={`${btn} bg-navy text-primary-foreground`}>Book a demo</a>
            </div>
            <div className="absolute -right-6 top-6 hidden h-16 w-16 place-items-center rounded-2xl bg-brand shadow-xl md:grid"><MessageCircle className="h-8 w-8" /></div>
          </div>
          <div className="relative mx-auto h-72 w-72">
            <img src={support} alt="" loading="lazy" className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-brand-soft object-cover" />
            <img src={clinic} alt="" loading="lazy" className="float absolute right-0 top-0 h-20 w-20 rounded-full border-4 border-sun object-cover" />
            <img src={realestate} alt="" loading="lazy" className="float absolute bottom-2 right-4 h-20 w-20 rounded-full border-4 border-brand object-cover" style={{ animationDelay: "1s" }} />
            <img src={booking} alt="" loading="lazy" className="float absolute bottom-10 left-0 h-16 w-16 rounded-full border-4 border-destructive object-cover" style={{ animationDelay: "2s" }} />
          </div>
        </div>
      </section>

      <FaqSection />
      <ContactSection />

      {/* Footer */}
      <footer data-reveal className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-10 rounded-[2.5rem] bg-foreground px-6 py-12 text-background sm:px-10 md:py-14 sm:grid-cols-2 md:grid-cols-4">
          {[["Sitemap", [["About", "#top"], ["Features", "#features"], ["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Contact", "#contact"]]], ["Industries", [["Clothing Shops", "#industry"], ["Boutiques", "#industry"], ["Online Retailers", "#industry"], ["SMEs", "#industry"], ["eCommerce", "#industry"]]], ["Solutions", [["Customer Support", "#features"], ["Lead Capture", "#features"], ["Conversation Inbox", "#features"], ["Sales Follow-ups", "#features"]]]].map(([h, l]: any) => (
            <div key={h}><p className="font-bold">{h}</p><ul className="mt-4 space-y-2 text-sm">{l.map(([x, href]: string[]) => <li key={x}><a href={href} className="opacity-70 transition hover:opacity-100 focus-visible:opacity-100">{x}</a></li>)}</ul></div>
          ))}
          <div className="flex flex-col items-start gap-6 md:items-end">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand"><img src={veyloMarkWhite} alt="Veylo" width={278} height={278} loading="lazy" className="h-7 w-7" /></div>
            <div className="flex gap-2">{[[Facebook, "Facebook", "https://facebook.com"], [Linkedin, "LinkedIn", "https://linkedin.com"], [Youtube, "YouTube", "https://youtube.com"], [Instagram, "Instagram", "https://instagram.com"]].map(([I, n, u]: any) => <a key={n} href={u} target="_blank" rel="noreferrer" aria-label={n} className="grid h-10 w-10 place-items-center rounded-full opacity-80 transition hover:-translate-y-0.5 hover:bg-brand hover:opacity-100"><I className="h-5 w-5" /></a>)}</div>
            <p className="text-xs opacity-60 md:text-right">© 2026 Veylo AI.<br />Helping African businesses grow.<br />Harare, Zimbabwe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ n, title, desc, items, children, reverse, pill }: { n: string; title: React.ReactNode; desc: string; items: string[]; children: React.ReactNode; reverse?: boolean; pill?: boolean }) {
  return (
    <div className="grid items-center gap-14 md:grid-cols-2">
      <div className={reverse ? "md:order-2" : ""}>{children}</div>
      <div className="relative">
        <span className="absolute -top-6 right-6 text-[8rem] font-extrabold leading-none text-muted">{n}</span>
        <h3 className="relative text-3xl font-bold tracking-tight md:text-4xl">{title}</h3>
        <p className="relative mt-4 max-w-xs text-sm text-muted-foreground">{desc}</p>
        <Ticks items={items} pill={pill ?? true} />
        <p className="mt-8 text-sm italic text-muted-foreground">Always consistent. Always available.</p>
      </div>
    </div>
  );
}
