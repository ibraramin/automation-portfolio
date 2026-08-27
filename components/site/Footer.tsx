import Link from "next/link";
import Icon from "./icons";
import { SITE } from "./config";

const LINKS = [
  { label: "Services", href: "/services" },
  { label: "Research", href: "/research" },
  { label: "Live demos", href: "/demos" },
  { label: "Free audit", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-surface/40">
      <div className="container-site py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-ink">{SITE.name}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Custom WhatsApp, AI and workflow automation for small businesses. {SITE.tagline}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-edge bg-surface-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <Icon name="clock" className="h-3.5 w-3.5 text-accent" />
              {SITE.timezone} · replies within a business day
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Talk to us
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-ink"
                >
                  <Icon name="whatsapp" className="h-4 w-4 text-accent" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-ink"
                >
                  <Icon name="mail" className="h-4 w-4 text-sky" />
                  {SITE.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 text-muted" />
                Typically replies within one business day
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-edge pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {SITE.name}. Built around your workflow.</p>
          <p className="font-mono">No robots. Just workflows.</p>
        </div>
      </div>
    </footer>
  );
}
