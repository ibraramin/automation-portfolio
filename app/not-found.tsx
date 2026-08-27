import type { Metadata } from "next";
import Button from "@/components/site/Button";
import { SITE } from "@/components/site/config";

export const metadata: Metadata = {
  title: "Page not found: Nexus Automations",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-20 text-center">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        That page moved, or it never existed. The rest of the site is very much alive.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button href="/contact">{SITE.cta}</Button>
        <Button href="/demos" variant="secondary">
          Try a live demo
        </Button>
      </div>
    </main>
  );
}
