import type { Metadata } from "next";
import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Live demos — Nexus Automations",
  description:
    "Try the automation yourself: three live interactive demos — WhatsApp order bot, AI invoice reader and lightning lead response. Download the n8n workflows for free.",
};

export default function DemosPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="container-site py-20 sm:py-24">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-wa">
            <span className="h-1 w-1 rounded-full bg-wa" aria-hidden="true" />
            Live demos
          </p>
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl xl:text-6xl">
            Try the automation yourself.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Every demo below is the real flow we build — running in your browser. Click through, then
            grab the matching n8n workflow JSON for free.
          </p>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {DEMOS.map((demo) => (
              <Link
                key={demo.slug}
                href={`/demos/${demo.slug}`}
                className="group flex flex-col rounded-2xl border border-edge bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-wa/40 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.5)]"
              >
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
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">{demo.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{demo.tagline}</p>
                <div className="mt-4 rounded-xl border border-wa/25 bg-wa/10 px-3.5 py-2.5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted">
                    The win
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-wa">{demo.metric}</p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-wa">
                  Run the demo
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-edge bg-surface p-8 sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                Want one of these for your business?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                We build custom n8n + AI + WhatsApp automations for small businesses. Tell us what eats
                your week and get a free automation audit.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-full bg-wa px-6 py-3 text-sm font-semibold text-wa-ink transition-colors hover:bg-wa-strong"
            >
              Book a free audit →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
