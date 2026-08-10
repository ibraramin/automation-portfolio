import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProofStrip from "@/components/site/ProofStrip";
import ServicesGrid from "@/components/site/ServicesGrid";
import DemosGrid from "@/components/site/DemosGrid";
import ProcessSection from "@/components/site/ProcessSection";
import CTASection from "@/components/site/CTASection";
import HeroPipeline from "@/components/site/HeroPipeline";
import Button from "@/components/site/Button";

const STATS = [
  { value: "10+", label: "hours saved every week" },
  { value: "<5 min", label: "lead response, on autopilot" },
  { value: "1–2 wks", label: "from kickoff to live" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-b"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-wa/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-20 -right-40 h-[26rem] w-[26rem] rounded-full bg-sky/10 blur-[130px]"
        aria-hidden="true"
      />

      <div className="container-site grid gap-14 pt-20 pb-20 md:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-28">
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-edge bg-surface-soft px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" aria-hidden="true" />
            WhatsApp + AI automation, built around your workflow
          </p>
          <h1
            className="animate-fade-up mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] xl:text-[4rem]"
            style={{ animationDelay: "80ms" }}
          >
            Automation for small businesses — built around your workflow,{" "}
            <span className="bg-linear-to-r from-wa to-sky bg-clip-text text-transparent">
              delivered in your timezone.
            </span>
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Custom WhatsApp, AI and workflow automations that answer every customer, capture every
            order, and save your team 10+ hours a week — without the agency overhead.
          </p>
          <div
            className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "240ms" }}
          >
            <Button href="/contact" size="lg">
              Free automation audit
            </Button>
            <Button href="/demos" size="lg" variant="secondary">
              Try a live demo
            </Button>
          </div>
          <dl
            className="animate-fade-up mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-edge pt-7"
            style={{ animationDelay: "320ms" }}
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-mono text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  {stat.value}
                </dd>
                <dd className="mt-1 text-xs leading-snug text-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroPipeline />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProofStrip />
        <ServicesGrid />
        <DemosGrid />
        <ProcessSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
