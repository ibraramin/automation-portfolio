import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import AuditForm from "@/components/site/AuditForm";
import Button from "@/components/site/Button";
import Reveal from "@/components/site/Reveal";
import Icon from "@/components/site/icons";
import { SITE } from "@/components/site/config";

export const metadata: Metadata = {
  title: "Free automation audit: Nexus Automations",
  description:
    "Book a free automation audit. Tell us your three most annoying manual tasks and we'll show you exactly how to automate them.",
};

const POINTS = [
  "A map of your repetitive work, ranked by time saved",
  "A fixed quote per workflow, no hourly billing",
  "A reply within one business day, usually faster",
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-b"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-wa/10 blur-[120px]"
            aria-hidden="true"
          />
          <Reveal className="relative container-site pt-20 pb-16 md:pt-28">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-wa">
              <span className="h-1 w-1 rounded-full bg-wa" aria-hidden="true" />
              Free audit
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl xl:text-6xl">
              Book your free automation audit.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Tell us the tasks that eat most of your week. We&apos;ll show you exactly how to automate
              them, before you spend a dime on manual work.
            </p>
          </Reveal>
        </section>

        <section className="container-site pb-20 sm:pb-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
            <Reveal className="h-full">
              <div className="h-full rounded-2xl border border-edge bg-surface p-6 sm:p-8">
                <AuditForm />
              </div>
            </Reveal>

            <Reveal className="h-full" delay={120}>
              <aside className="space-y-6">
              <div className="rounded-2xl border border-edge bg-surface p-6">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                  What you get
                </h2>
                <ul className="mt-4 space-y-3">
                  {POINTS.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm leading-relaxed text-ink/90"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-wa/15 text-wa">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-edge bg-surface p-6">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
                  Prefer to talk?
                </h2>
                <div className="mt-4 space-y-3">
                  <Button
                    href={SITE.whatsappUrl}
                    variant="secondary"
                    className="w-full"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="whatsapp" className="h-4 w-4 text-wa" />
                    {SITE.whatsappLabel}
                  </Button>
                  <Button href={`mailto:${SITE.email}`} variant="secondary" className="w-full">
                    <Icon name="mail" className="h-4 w-4 text-sky" />
                    {SITE.email}
                  </Button>
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-muted">
                  <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
                  {SITE.timezone}, we&apos;re live during your business hours.
                </p>
              </div>

              <p className="px-1 text-xs leading-relaxed text-muted">
                No pressure, no jargon and no pricing games. If we can&apos;t save you time, we&apos;ll tell
                you, and point you to what can.
              </p>
              </aside>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
