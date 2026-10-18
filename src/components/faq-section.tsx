import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const faqs = [
  ["What does Veylo do?", "Veylo answers customer enquiries on WhatsApp, captures leads, organises chats and follows up with interested customers."],
  ["What kinds of questions can Veylo answer?", "It can answer common questions about prices, sizes, stock, delivery and payment options such as EcoCash, cash and swipe, using your business’s product list and information."],
  ["How do I get started?", "Connect your WhatsApp number, add your products, prices and FAQs, then go live."],
  ["Can my team manage conversations in one place?", "Yes. Veylo organises WhatsApp chats in one central dashboard, with one inbox for your team."],
  ["Can a person take over a conversation?", "Yes. A conversation can be handed over to a person anytime."],
  ["What plans does Veylo offer?", "Veylo offers Starter and Growth monthly subscriptions. Growth includes everything in Starter, plus chat organisation, lead management and automatic follow-ups. Contact the team to discuss the right plan for your business."],
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <div className="grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-20">
        <div>
          <p className="text-sm font-semibold text-brand">Frequently asked questions</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">A few things<br />you might ask.</h2>
          <p className="mt-5 text-muted-foreground">Still have a question? We’d love to hear from you.</p>
          <Button asChild variant="link" className="mt-5 h-auto p-0 font-semibold"><a href="#contact">Ask the team <ArrowRight /></a></Button>
        </div>
        <Accordion type="single" collapsible className="border-t border-border">
          {faqs.map(([question, answer], i) => (
            <AccordionItem key={question} value={`faq-${i}`}>
              <AccordionTrigger className="gap-5 py-6 text-base font-semibold">{question}</AccordionTrigger>
              <AccordionContent className="max-w-xl pb-6 leading-relaxed text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}