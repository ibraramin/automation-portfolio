"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "./Button";
import Icon from "./icons";
import { SITE } from "./config";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Demos", href: "/demos" },
  { label: "Contact", href: "/contact" },
] as const;

function Logo() {
  const [first, ...rest] = SITE.name.split(" ");
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name} — home`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors duration-200 group-hover:border-wa/50">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-wa"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="12" r="2.2" />
          <circle cx="18.5" cy="6" r="2.2" />
          <circle cx="18.5" cy="18" r="2.2" />
          <path d="M7.4 11l8.9-4M7.4 13l8.9 4" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        {first}
        <span className="text-wa">.</span>
        {rest.length > 0 ? (
          <span className="ml-1.5 hidden text-muted sm:inline">{rest.join(" ")}</span>
        ) : null}
      </span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Button href="/contact" size="sm">
            {SITE.cta}
          </Button>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-ink md:hidden"
          aria-expanded={open}
          aria-controls={open ? "mobile-nav" : undefined}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-surface/95 px-5 py-5 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4">
            <Button href="/contact" className="w-full" onClick={() => setOpen(false)}>
              {SITE.cta}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
