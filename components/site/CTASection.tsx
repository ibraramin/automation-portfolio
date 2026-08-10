import Button from "./Button";
import { SITE } from "./config";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-40 mask-fade-b"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-wa/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-0 h-80 w-96 rounded-full bg-sky/10 blur-[120px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-wa/25 bg-wa/10 px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-wa">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" aria-hidden="true" />
          No cost · No obligation
        </p>
        <h2 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Your first audit is free.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          Tell us your three most annoying manual tasks. We&apos;ll show you exactly how to automate
          them — before you spend a taka or a pound.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/contact" size="lg">
            {SITE.cta}
          </Button>
          <Button href="/services" size="lg" variant="secondary">
            See what we build
          </Button>
        </div>
      </div>
    </section>
  );
}
