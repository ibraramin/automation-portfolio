import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Icon from "@/components/site/icons";
import Reveal from "@/components/site/Reveal";
import { SITE } from "@/components/site/config";

export const metadata: Metadata = {
  title: "Privacy: Nexus Automations",
  description:
    "How Nexus Automations handles your data. No cookies, no analytics trackers, no data selling. Just your contact details for a free automation audit.",
};

const FACTS: { title: string; text: string }[] = [
  {
    title: "No cookies, no trackers",
    text: "This site sets no tracking cookies and loads no analytics or advertising scripts. Your visit is not profiled or sold to anyone.",
  },
  {
    title: "Theme preference stays on your device",
    text: "The only thing stored in your browser is your light or dark theme choice, kept in localStorage on your own device. We never see it.",
  },
  {
    title: "What you send us, and why",
    text: "When you request a free automation audit, you share your name, business and contact details so we can reply. We use them only to answer you and to prepare your audit.",
  },
  {
    title: "No marketing lists",
    text: "We do not add you to mailing lists, and we never share your details with third parties for marketing.",
  },
  {
    title: "Audit forms",
    text: "Audit requests sent through the contact form may be processed via a third-party form service (Web3Forms) once an access key is wired in. The data sent is the same as an email to us.",
  },
  {
    title: "Your rights",
    text: "You can ask us what we hold about you, correct it, or ask us to delete it at any time. Just email us and we will sort it within a few business days.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-grid opacity-50 mask-fade-b"
            aria-hidden="true"
          />
          <Reveal className="relative container-site pt-20 pb-14 md:pt-28">
            <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-wa">
              <span className="h-1 w-1 rounded-full bg-wa" aria-hidden="true" />
              Privacy
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl xl:text-6xl">
              Plain language, no fine print.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              We built an automation business, not a data business. Here is exactly what we do with
              the little we collect.
            </p>
          </Reveal>
        </section>

        <section className="container-site pb-20 sm:pb-28">
          <div className="grid gap-5 md:grid-cols-2">
            {FACTS.map((fact, index) => (
              <Reveal key={fact.title} delay={(index % 2) * 90} className="h-full">
                <div className="h-full rounded-2xl border border-edge bg-surface p-6 sm:p-7">
                  <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-ink">
                    <Icon name="shield" className="h-4 w-4 shrink-0 text-wa" />
                    {fact.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{fact.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10" delay={120}>
            <div className="rounded-2xl border border-edge bg-surface p-6 sm:p-8">
              <h2 className="text-base font-semibold tracking-tight text-ink">Questions or requests</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Email {SITE.email} or message us on WhatsApp and we will reply within one business
                day. Last updated: 11 August 2026.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-edge bg-surface-soft px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-edge-strong hover:bg-surface-soft-2"
                >
                  <Icon name="mail" className="h-4 w-4 text-sky" />
                  {SITE.email}
                </a>
                <a
                  href={SITE.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-edge bg-surface-soft px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-edge-strong hover:bg-surface-soft-2"
                >
                  <Icon name="whatsapp" className="h-4 w-4 text-wa" />
                  WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
