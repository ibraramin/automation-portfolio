import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const STEPS = [
  {
    num: "01",
    title: "Free automation audit",
    text: "We map your repetitive work and pick the three tasks worth automating first.",
  },
  {
    num: "02",
    title: "Fixed quote per workflow",
    text: "One clear price per workflow. No hourly surprises, no scope creep.",
  },
  {
    num: "03",
    title: "Built in 1–2 weeks",
    text: "We build and test against your real inbox, calendar and WhatsApp.",
  },
  {
    num: "04",
    title: "Handover + support retainer",
    text: "You keep full ownership. We stay on retainer for tweaks and scale.",
  },
];

export default function ProcessSection() {
  return (
    <section
      className="cv-auto container-site py-20 sm:py-28"
      style={{ containIntrinsicSize: "auto 42rem" }}
    >
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            From &quot;annoying task&quot; to automation{" "}
            <span className="text-wa">in weeks, not months.</span>
          </>
        }
        subtitle="No workshops. No 40-page proposals. Just a straight path from audit to automation."
      />
      <ol className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.num} className="relative h-full">
            <Reveal delay={index * 90} className="h-full">
              <div className="h-full rounded-2xl border border-edge bg-surface p-6 transition-colors duration-300 hover:border-edge-strong sm:p-7">
                <span className="font-mono text-sm font-semibold text-wa">{step.num}</span>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </Reveal>
            {index < STEPS.length - 1 ? (
              <span
                className="absolute -right-3 top-1/2 hidden h-px w-6 bg-linear-to-r from-wa/60 to-transparent xl:block"
                aria-hidden="true"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
