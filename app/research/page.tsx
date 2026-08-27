import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Button from "@/components/site/Button";
import Icon from "@/components/site/icons";
import { SITE } from "@/components/site/config";

export const metadata: Metadata = {
  title: "Research: Why Speed Saves Sales — Nexus Automations",
  description:
    "Research behind our automations: reply speed multiplies conversion, missed contacts are lost sales, WhatsApp outperforms email, and RAG cuts hallucination and cost.",
};

const CARDS = [
  {
    icon: "zap" as const,
    title: "Speed = Money",
    bullets: [
      "Reply within 1 minute → 391% higher conversion than slower replies.",
      "5 minutes vs 30 minutes → 100× more likely to connect with the lead.",
      "<1 hour vs slower → 7× more likely to qualify the lead.",
    ],
    cites: "Velocify / MIT Sloan / HBR — lead response studies.",
  },
  {
    icon: "phone" as const,
    title: "Missed = Lost",
    bullets: [
      "SMBs miss ~62% of inbound calls — most never call back.",
      "61% of customers won’t call again after one missed attempt.",
      "A single missed lead often means the sale goes to the competitor who answered.",
    ],
    cites: "Invoca / BrightLocal / LocalSplash — inbound call studies.",
  },
  {
    icon: "message" as const,
    title: "WhatsApp Edge",
    bullets: [
      "WhatsApp: 90–98% open rate, ~45% CTR vs ~21.5% for email.",
      "60–80% of routine inquiries handled without a human when automated well.",
      "Customers already live on WhatsApp — reply there, don’t make them switch apps.",
    ],
    cites: "Industry benchmarks & Hyperleap 2026 roundup — open/CTR studies.",
  },
  {
    icon: "database" as const,
    title: "RAG Fixes Hallucination",
    bullets: [
      "Response time -45% — from 15 min to ~23 seconds with RAG answers.",
      "Support cost -30% — ~$0.70 per automated reply vs $6–40 human-handled.",
      "Knowledge maintenance -72%; 40–50% of tickets deflected automatically.",
    ],
    cites: "Wonderchat / ResearchGate — RAG & support automation studies.",
  },
];

export default function ResearchPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4] mask-fade-b"
            aria-hidden="true"
          />
          <div className="relative container-site pt-20 pb-14 md:pt-28 md:pb-20">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
              Research
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl xl:text-6xl">
              Research: why speed saves sales.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              The four stats we build every workflow around — from reply speed to RAG cost — sourced for your BD reels and client calls.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact">
                Free automation audit
                <Icon name="arrow-right" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button href={SITE.whatsappUrl} variant="secondary" target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" className="h-4 w-4 text-accent" />
                WhatsApp us
              </Button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="container-site pb-16 sm:pb-20">
          <div className="grid gap-5 md:grid-cols-2">
            {CARDS.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-edge bg-surface p-6 sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                    <Icon name={card.icon} className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight text-ink">{card.title}</h2>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-edge pt-3 font-mono text-[10.5px] leading-relaxed text-muted">
                  {card.cites}
                </p>
              </article>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="mt-8 rounded-2xl border border-edge bg-surface-soft p-6 sm:p-8">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Chart: 5 min vs 30 min — likelihood to connect
            </h3>
            <p className="mt-2 text-sm text-muted">
              Same lead, different wait. Replying in 5 minutes is <span className="font-semibold text-ink">100×</span> more likely to connect than waiting 30.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-end gap-4">
                <div className="w-20 shrink-0 font-mono text-xs text-muted">5 min</div>
                <div className="h-10 flex-1 rounded-full bg-accent" style={{ width: "100%" }} aria-hidden="true" />
                <div className="w-16 shrink-0 font-mono text-sm font-semibold text-accent">100×</div>
              </div>
              <div className="flex items-end gap-4">
                <div className="w-20 shrink-0 font-mono text-xs text-muted">30 min</div>
                <div className="h-10 flex-1 rounded-full bg-edge" style={{ width: "1%" }} aria-hidden="true" />
                <div className="w-16 shrink-0 font-mono text-sm font-semibold text-muted">1×</div>
              </div>
            </div>
            <p className="mt-4 font-mono text-[10.5px] text-muted">
              Source: Velocify/MIT Sloan — bars are illustrative, proportionally scaled (100 vs 1).
            </p>
          </div>

          {/* Footnotes */}
          <div className="mt-8 rounded-xl border border-edge bg-surface p-5">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">Citations</p>
            <ul className="mt-3 space-y-1 font-mono text-[11px] leading-relaxed text-muted">
              <li>Speed: Velocify “Hot Leads” + MIT Sloan performance studies via HBR summary — 1 min / 5 min vs 30 min / &lt;1 hr benchmarks.</li>
              <li>Missed: Invoca inbound call study + BrightLocal/LocalSplash local-service call research — 62% miss, no callback behavior.</li>
              <li>WhatsApp: Email open/CTR vs WhatsApp open/CTR aggregated benchmarks; Hyperleap 2026 WhatsApp Business stat roundup.</li>
              <li>RAG: Wonderchat case (15m→23s), ResearchGate & support cost analyses — hallucination + maintenance + deflection.</li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-edge bg-surface/40">
          <div className="container-site py-14 text-center sm:py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Stop losing sales to slow replies.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              We audit your three most tedious workflows for free — then automate the ones that move sales.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/contact" size="lg">
                Free automation audit
                <Icon name="arrow-right" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button href={SITE.whatsappUrl} size="lg" variant="secondary" target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" className="h-4 w-4 text-accent" />
                WhatsApp us
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
