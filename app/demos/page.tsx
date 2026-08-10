import Link from "next/link";
import { DEMOS } from "@/lib/demos";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata = {
  title: "Demos — Nexus Automations",
  description:
    "Try the automation yourself: three live interactive demos — WhatsApp order bot, AI invoice reader and lightning lead response. Download the n8n workflows for free.",
};

export default function DemosPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#0a0a0a] text-white">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold tracking-widest text-[#25D366] uppercase">Live demos</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Try the automation yourself.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/60">
          Every demo below is the real flow we build — running in your browser. Click through, then grab the
          matching n8n workflow JSON for free.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {DEMOS.map((demo) => (
            <Link
              key={demo.slug}
              href={`/demos/${demo.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#0e0e0e] p-6 transition-colors hover:border-[#25D366]/50"
            >
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
              <h2 className="mt-4 text-xl font-semibold text-white">{demo.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{demo.tagline}</p>
              <div className="mt-4 rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 px-3 py-2">
                <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">The win</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#25D366]">{demo.metric}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#25D366]">
                Run the demo
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#25D366]/15 via-[#0e0e0e] to-[#0e0e0e] p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Want one of these for your business?</h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              We build custom n8n + AI + WhatsApp automations for SMBs in Bangladesh and Europe. Tell us what
              eats your week and get a free automation audit.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#1fb958]"
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
