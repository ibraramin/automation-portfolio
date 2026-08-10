import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/lib/demos";
import WhatsAppOrderBot from "@/components/demos/WhatsAppOrderBot";
import InvoiceReader from "@/components/demos/InvoiceReader";
import LeadResponse from "@/components/demos/LeadResponse";
import MeetingMinutesBot from "@/components/demos/MeetingMinutesBot";
import SpreadsheetRescue from "@/components/demos/SpreadsheetRescue";
import EmailTriage from "@/components/demos/EmailTriage";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

type DemoSlug = (typeof DEMOS)[number]["slug"];

const DEMO_COMPONENTS: Record<DemoSlug, ComponentType> = {
  "whatsapp-order-bot": WhatsAppOrderBot,
  "ai-invoice-reader": InvoiceReader,
  "lightning-lead-response": LeadResponse,
  "meeting-minutes-bot": MeetingMinutesBot,
  "spreadsheet-rescue": SpreadsheetRescue,
  "email-triage": EmailTriage,
};

const HOW_IT_WORKS: Record<DemoSlug, string[]> = {
  "whatsapp-order-bot": [
    "Customer messages your WhatsApp number, the bot greets them and shows product quick-replies.",
    "The bot walks them through size, delivery address and a bKash payment instruction with your merchant number.",
    "When they reply with a Transaction ID, the bot checks its format, logs the order and flags it for a 30-second human confirm in the bKash app.",
    "Order is logged to Google Sheets, dispatched to Pathao, and the customer gets live courier updates on WhatsApp.",
  ],
  "ai-invoice-reader": [
    "Invoices arrive by email (or upload) and land in the workflow: PDFs are text-extracted, images go through OCR.",
    "OpenAI Vision reads the document and returns structured JSON: vendor, invoice number, date, VAT, line items.",
    "Every field is validated, complete rows are appended to your invoices ledger; anything uncertain is flagged for review.",
    "Your bookkeeper gets a Slack confirm and never retypes a supplier invoice again.",
  ],
  "lightning-lead-response": [
    "A lead message hits the webhook from your website form, WhatsApp or email.",
    "OpenAI scores it: 0-10, intent, budget signal, urgency and buying stage.",
    "A personalized reply is drafted from your brand voice and saved to your CRM as a new contact.",
    "Your team is alerted on Slack the moment a hot lead lands, reply inside five minutes.",
  ],
  "meeting-minutes-bot": [
    "A meeting recording or raw transcript hits the workflow webhook.",
    "Whisper transcribes it, then OpenAI extracts the title, decisions and owner-assigned action items as structured JSON.",
    "Minutes are posted to a Notion page and the summary lands in Slack with every action item and owner.",
    "Anything missing an owner is held for a quick human review instead of being posted half-done.",
  ],
  "spreadsheet-rescue": [
    "A messy CSV or spreadsheet export lands in the workflow.",
    "OpenAI suggests a schema, then code normalizes names, emails, dates and amounts.",
    "Rows are deduplicated by email and validated, with warnings collected for review.",
    "Clean rows upsert to Supabase or Airtable, a backup lands in Google Sheets, and your team gets a cleanup report on Slack.",
  ],
  "email-triage": [
    "Gmail watch fires when new mail lands, pulling subject, sender and body.",
    "OpenAI classifies each message as lead, invoice or spam, and ranks priority.",
    "A reply is drafted for the lead and posted to Slack as an approval request, waiting for a human.",
    "On approval the reply sends and the exchange is logged to the HubSpot timeline; invoices are filed and spam is trashed.",
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
    title: `${demo.title}: Live Demo | Nexus Automations`,
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-wa/40 bg-wa/10 text-xs font-bold text-wa">
        {i + 1}
      </span>
      <p className="text-sm leading-relaxed text-muted">{step}</p>
    </li>
  ));

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="container-site py-16 sm:py-20">
          <Link href="/demos" className="text-sm font-medium text-muted transition-colors hover:text-wa">
            ← All demos
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-1.5">
                {demo.markets.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-edge bg-surface-soft px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl xl:text-6xl">
                {demo.title}
              </h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted">{demo.tagline}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-wa/25 bg-wa/10 px-5 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
                The win
              </p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-wa">{demo.metric}</p>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{demo.description}</p>

          {/* Interactive demo, the simulation canvas stays dark in both themes */}
          <div className="mx-auto mt-10 max-w-3xl">
            <Demo />
          </div>

          {/* Tech + how it works */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">How it works</h2>
              <ol className="mt-4 space-y-4">{steps}</ol>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-ink">Under the hood</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {demo.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-edge bg-surface-soft px-3 py-1.5 font-mono text-xs text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                This exact flow ships as a downloadable n8n workflow, point it at your own accounts,
                fill in the credentials and it runs on your VPS or the n8n cloud.
              </p>
            </div>
          </div>

          {/* Download + CTA */}
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-edge bg-surface p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">Steal this workflow.</h2>
              <p className="mt-1 text-sm text-muted">
                The full n8n JSON, nodes, parameters and connections, free to download and adapt.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <a
                href={demo.jsonFile}
                download
                data-json-downloaded={demo.slug}
                className="rounded-full bg-wa px-6 py-3 text-center text-sm font-semibold text-wa-ink transition-colors hover:bg-wa-strong"
              >
                Download the n8n workflow (free)
              </a>
              <Link
                href="/contact"
                className="rounded-full border border-edge px-6 py-3 text-center text-sm font-semibold text-muted transition-colors hover:border-wa/50 hover:text-ink"
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
