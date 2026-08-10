import Link from "next/link";
import SectionHeading from "./SectionHeading";
import Icon from "./icons";
import { SERVICES, type Service } from "./services-data";

function ServiceCard({ service }: { service: Service }) {
  const isWa = service.accent === "wa";
  return (
    <Link
      href="/contact"
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)]"
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
          className="h-4 w-4 text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-ink"
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
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted"
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
    <section id="services" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="What we automate"
        title={
          <>
            Automations that pay for themselves{" "}
            <span className="text-muted">— in outcomes, not jargon.</span>
          </>
        }
        subtitle="Every workflow is custom-built, delivered in 1–2 weeks, and priced as one fixed quote per workflow."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
