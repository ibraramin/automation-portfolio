import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/lib/demos";
import WhatsAppOrderBot from "@/components/demos/WhatsAppOrderBot";
import InvoiceReader from "@/components/demos/InvoiceReader";
import LeadResponse from "@/components/demos/LeadResponse";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

type DemoSlug = (typeof DEMOS)[number]["slug"];

const DEMO_COMPONENTS: Record<DemoSlug, ComponentType> = {
  "whatsapp-order-bot": WhatsAppOrderBot,
  "ai-invoice-reader": InvoiceReader,
  "lightning-lead-response": LeadResponse,
};

const HOW_IT_WORKS: Record<DemoSlug, string[]> = {
  "whatsapp-order-bot": [
    "Customer messages your WhatsApp number — the bot greets them in Bangla + English and shows product quick-replies.",
    "The bot walks them through size, delivery address and a bKash payment instruction with your merchant number.",
    "When they reply with a Transaction ID, the bot checks its format, logs the order and flags it for a 30-second human confirm in the bKash app.",
    "Order is logged to Google Sheets, dispatched to Pathao, and the customer gets live courier updates on WhatsApp.",
  ],
  "ai-invoice-reader": [
    "Invoices arrive by email (or upload) and land in the workflow — PDFs are text-extracted, images go through OCR.",
    "OpenAI Vision reads the document and returns structured JSON: vendor, invoice number, date, VAT, line items.",
    "Every field is validated — complete rows are appended to your invoices ledger; anything uncertain is flagged for review.",
    "Your bookkeeper gets a Slack confirm and never retypes a supplier invoice again.",
  ],
  "lightning-lead-response": [
    "A lead message hits the webhook from your website form, WhatsApp or email.",
    "OpenAI scores it: 0-10, intent, budget signal, urgency and buying stage.",
    "A personalized reply is drafted from your brand voice and saved to your CRM as a new contact.",
    "Your team is alerted on Slack the moment a hot lead lands — reply inside five minutes.",
  ],
};

export function generateStaticParams() {
  return DEMOS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(props: PageProps<"/demos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const demo = DEMOS.find((d) => d.slug === slug);
  if (!demo) return { title: "Demo not found" };
  return {
    title: `${demo.title} — Live Demo | Nexus Automations`,
    description: demo.tagline,
  };
}

export default async function DemoPage(props: PageProps<"/demos/[slug]">) {
  const { slug } = await props.params;
  const demo = DEMOS.find((d) => d.slug === slug);
  if (!demo) notFound();

  const Demo = DEMO_COMPONENTS[demo.slug];
  const steps: ReactNode[] = (HOW_IT_WORKS[demo.slug] ?? []).map((step, i) => (
    <li key={i} className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-xs font-bold text-[#25D366]">
        {i + 1}
      </span>
      <p className="text-sm leading-relaxed text-white/70">{step}</p>
    </li>
  ));

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#0a0a0a] text-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/demos" className="text-sm font-medium text-white/50 transition-colors hover:text-[#25D366]">
          ← All demos
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-1.5">
              {demo.markets.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60"
                >
                  {m}
                </span>
              ))}
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{demo.title}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/60">{demo.tagline}</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-[#25D366]/25 bg-[#25D366]/5 px-5 py-3">
            <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">The win</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-[#25D366]">{demo.metric}</p>
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-white/55">{demo.description}</p>

        {/* Interactive demo */}
        <div className="mt-10">
          <Demo />
        </div>

        {/* Tech + how it works */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-white">How it works</h2>
            <ol className="mt-4 space-y-4">{steps}</ol>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Under the hood</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {demo.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/45">
              This exact flow ships as a downloadable n8n workflow — point it at your own accounts, fill in the
              credentials and it runs on your VPS or the n8n cloud.
            </p>
          </div>
        </div>

        {/* Download + CTA */}
        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/10 bg-[#0e0e0e] p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Steal this workflow.</h2>
            <p className="mt-1 text-sm text-white/50">
              The full n8n JSON — nodes, parameters and connections — free to download and adapt.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={demo.jsonFile}
              download
              data-json-downloaded={demo.slug}
              className="rounded-full bg-[#25D366] px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#1fb958]"
            >
              Download the n8n workflow (free)
            </a>
            <Link
              href="/contact"
              className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white/80 transition-colors hover:border-[#25D366]/50 hover:text-white"
            >
              Want it customized? →
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
