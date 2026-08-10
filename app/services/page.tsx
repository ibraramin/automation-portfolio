import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import CTASection from "@/components/site/CTASection";
import Button from "@/components/site/Button";
import Icon from "@/components/site/icons";
import { SERVICES, type Service } from "@/components/site/services-data";

export const metadata: Metadata = {
  title: "Services — Nexus Automations",
  description:
    "Six outcome-driven automations for small businesses: WhatsApp bots, invoice extraction, lightning lead response, booking, CRM sync and voice AI. Free audit.",
};

function ServiceBlock({ service, index }: { service: Service; index: number }) {
  const isWa = service.accent === "wa";
  const tint = isWa ? "border-wa/25 bg-wa/10 text-wa" : "border-sky/25 bg-sky/10 text-sky";
  return (
    <article
      id={service.id}
      className="grid gap-8 border-t border-white/10 py-14 first:border-t-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
    >
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-muted">
          {String(index + 1).padStart(2, "0")} / 06
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${tint}`}>
            <Icon name={service.icon} className="h-6 w-6" />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {service.title}
          </h2>
        </div>
        <p className="mt-4 text-lg font-medium text-ink">{service.outcome}</p>
      </div>
      <div className="space-y-5">
        <div>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            The pain
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">{service.pain}</p>
        </div>
        <div>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            What we build
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/90 sm:text-[15px]">{service.build}</p>
        </div>
        <div>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            Tech we use
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {service.tech.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-muted"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            Who it&apos;s for
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/90 sm:text-[15px]">
            {service.audience}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-b"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-6xl px-5 pt-20 pb-14 sm:px-8 md:pt-28 md:pb-20">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-wa">
              <span className="h-1 w-1 rounded-full bg-wa" aria-hidden="true" />
              Services
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Automations that pay for themselves.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Six workflows cover most of the repetitive work in a small business. Every build
              starts with a free audit — so you only pay for what moves the needle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/contact">Free automation audit</Button>
              <Button href="/demos" variant="secondary">
                Try a demo
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          {SERVICES.map((service, index) => (
            <ServiceBlock key={service.id} service={service} index={index} />
          ))}
        </section>

        <CTASection />
      </main>
      <Footer />
    </>
  );
}
