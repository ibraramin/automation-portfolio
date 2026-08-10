import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import Icon from "./icons";
import { SERVICES, type Service } from "./services-data";

function ServiceCard({ service }: { service: Service }) {
  const isWa = service.accent === "wa";
  return (
    <Link
      href="/contact"
      className="group relative z-0 flex h-full flex-col gap-4 rounded-2xl border border-edge bg-surface p-6 transition-[transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-wa/30 after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8),0_0_24px_-8px_rgba(37,211,102,0.35)] after:opacity-0 after:transition-opacity after:duration-300 group-hover:after:opacity-100 sm:p-7"
    >
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl border ${
            isWa ? "border-wa/25 bg-wa/10 text-wa" : "border-sky/25 bg-sky/10 text-sky"
          }`}
        >
          <Icon name={service.icon} className="h-5 w-5" />
        </span>
        <Icon
          name="arrow-right"
          className="h-4 w-4 text-muted transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-ink"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-ink">{service.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{service.outcome}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {service.tech.slice(0, 3).map((tech) => (
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

export default function ServicesGrid() {
  return (
    <section
      id="services"
      className="cv-auto container-site py-20 sm:py-28"
      style={{ containIntrinsicSize: "auto 54rem" }}
    >
      <SectionHeading
        eyebrow="What we automate"
        title={
          <>
            Automations that pay for themselves{" "}
            <span className="text-muted">in outcomes, not jargon.</span>
          </>
        }
        subtitle="Every workflow is custom-built, delivered in 1–2 weeks, and priced as one fixed quote per workflow."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, index) => (
          <Reveal key={service.id} delay={index * 80} className="h-full">
            <ServiceCard service={service} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
