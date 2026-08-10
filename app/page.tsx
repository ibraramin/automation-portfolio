import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProofStrip from "@/components/site/ProofStrip";
import ServicesGrid from "@/components/site/ServicesGrid";
import DemosGrid from "@/components/site/DemosGrid";
import ProcessSection from "@/components/site/ProcessSection";
import CTASection from "@/components/site/CTASection";
import Button from "@/components/site/Button";
import Icon from "@/components/site/icons";

const STATS = [
  { value: "10+", label: "hours saved every week" },
  { value: "<5 min", label: "lead response, on autopilot" },
  { value: "1–2 wks", label: "from kickoff to live" },
];

const FLOW_STEPS = [
  "Order captured from WhatsApp",
  "Invoice #2041 generated + sent",
  "Team notified in Slack",
];

function WorkflowCard() {
  return (
    <div className="animate-fade-up relative" style={{ animationDelay: "200ms" }}>
      <div
        className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-wa/10 via-transparent to-sky/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-white/10 bg-surface/90 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" aria-hidden="true" />
            Order flow
          </p>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            n8n · live
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex justify-start">
            <p className="max-w-[85%] rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-ink">
              Hi, do you deliver to Banani today?
            </p>
          </div>
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-wa px-4 py-2.5 text-sm text-[#04150b]">
              Yes — order before 6 PM for same-day delivery.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
          {FLOW_STEPS.map((row) => (
            <p key={row} className="flex items-center gap-2.5 text-[13px] text-muted">
              <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-wa/15 text-wa">
                <Icon name="check" className="h-3 w-3" />
              </span>
              {row}
            </p>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-xs text-muted">Avg. first reply</span>
          <span className="font-mono text-sm font-semibold text-ink">under 5 seconds</span>
        </div>
      </div>
    </div>
  );
}

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

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pt-20 pb-20 sm:px-8 md:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-28">
        <div>
          <p className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" aria-hidden="true" />
            Dhaka → Europe · WhatsApp + AI automation
          </p>
          <h1
            className="animate-fade-up mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]"
            style={{ animationDelay: "80ms" }}
          >
            Automation for small businesses — built in Dhaka,{" "}
            <span className="bg-linear-to-r from-wa to-sky bg-clip-text text-transparent">
              delivered in your timezone.
            </span>
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Custom WhatsApp, AI and workflow automations that answer every customer, capture every
            order, and save your team 10+ hours a week — without the Western agency overhead.
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
            className="animate-fade-up mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-7"
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

        <WorkflowCard />
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
