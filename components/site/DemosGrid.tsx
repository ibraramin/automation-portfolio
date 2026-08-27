import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Button from "./Button";
import Reveal from "./Reveal";
import Icon from "./icons";
import { DEMOS, type DemoMeta } from "@/lib/demos";

function DemoCard({ demo }: { demo: DemoMeta }) {
  return (
    <Link
      href={`/demos/${demo.slug}`}
      className="group relative z-0 flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-edge bg-surface p-6 transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-accent/30 after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8),0_0_24px_-8px_rgba(14,116,144,0.25)] after:opacity-0 after:transition-opacity after:duration-300 group-hover:after:opacity-100 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
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
            className="rounded-full border border-edge bg-surface-soft px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted"
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
      className="cv-auto relative overflow-hidden border-y border-edge bg-surface/30 py-20 sm:py-28"
      style={{ containIntrinsicSize: "auto 46rem" }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4] mask-fade-b"
        aria-hidden="true"
      />
      <div className="relative container-site">
        <SectionHeading
          eyebrow="Live demos"
          title="Try the automation yourself."
          subtitle="Live demos you can run right now, the exact workflows we build for clients."
        />
        {DEMOS.length > 0 ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DEMOS.map((demo, index) => (
              <Reveal key={demo.slug} delay={index * 80} className="h-full">
                <DemoCard demo={demo} />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mx-auto mt-14 max-w-xl" delay={100}>
            <div className="rounded-2xl border border-dashed border-edge-strong bg-surface p-10 text-center">
              <Icon name="zap" className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-4 text-lg font-semibold text-ink">
                Demos are being published right now.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Book a live walkthrough instead, we&apos;ll show you the exact workflows on a call.
              </p>
              <div className="mt-6 flex justify-center">
                <Button href="/contact">Book a live walkthrough</Button>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
