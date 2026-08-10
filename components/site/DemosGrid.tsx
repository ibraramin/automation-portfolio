import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Icon from "./icons";
import { DEMOS, type DemoMeta } from "@/lib/demos";

function DemoCard({ demo }: { demo: DemoMeta }) {
  return (
    <Link
      href={`/demos/${demo.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-wa/30"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-wa/20 bg-wa/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-wa">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" />
          Live
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
          {demo.markets.join(" / ")}
        </span>
      </div>
      <div>
        <p className="font-mono text-2xl font-semibold tracking-tight text-ink sm:text-[1.7rem]">
          {demo.metric}
        </p>
        <h3 className="mt-2 text-base font-semibold tracking-tight text-ink">{demo.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{demo.tagline}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
        {demo.tech.slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted"
          >
            {tech}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function DemosGrid() {
  return (
    <section
      id="demos"
      className="relative overflow-hidden border-y border-white/10 bg-surface/30 py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-60 mask-fade-b"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Live demos"
          title="Try the automation yourself."
          subtitle="Live demos you can run right now — the exact workflows we build for clients."
        />
        {DEMOS.length > 0 ? (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMOS.map((demo) => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-14 max-w-xl rounded-2xl border border-dashed border-white/15 bg-surface p-10 text-center">
            <Icon name="zap" className="mx-auto h-8 w-8 text-wa" />
            <p className="mt-4 text-lg font-semibold text-ink">
              Demos are being published right now.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Book a live walkthrough instead — we&apos;ll show you the exact workflows on a call.
            </p>
            <div className="mt-6 flex justify-center">
              <Button href="/contact">{`Book a live walkthrough`}</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
