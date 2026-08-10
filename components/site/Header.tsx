"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "./Button";
import Icon from "./icons";
import { SITE } from "./config";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Live demos", href: "/demos" },
  { label: "Contact", href: "/contact" },
] as const;

type Theme = "light" | "dark";

function Logo() {
  const [first, ...rest] = SITE.name.split(" ");
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5"
      aria-label={`${SITE.name} — home`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-edge bg-surface-soft transition-colors duration-200 group-hover:border-wa/50">
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

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const stored = window.localStorage.getItem("nexus-theme");
      const prefersLight =
        window.matchMedia("(prefers-color-scheme: light)").matches && stored === null;
      initial = stored === "light" || prefersLight ? "light" : "dark";
      document.documentElement.classList.toggle("light", initial === "light");
    } catch {
      // storage or matchMedia unavailable — keep default dark theme
    }
    const t = window.setTimeout(() => setTheme(initial), 0);
    return () => window.clearTimeout(t);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("light", next === "light");
    try {
      window.localStorage.setItem("nexus-theme", next);
    } catch {
      // storage unavailable — theme still applies for this session
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      className="grid h-10 w-10 place-items-center rounded-lg border border-edge text-muted transition-colors hover:border-edge-strong hover:text-ink"
    >
      {theme === null ? (
        <span className="h-4 w-4 rounded-full border border-edge" aria-hidden="true" />
      ) : theme === "light" ? (
        <Icon name="moon" className="h-4.5 w-4.5" />
      ) : (
        <Icon name="sun" className="h-4.5 w-4.5" />
      )}
    </button>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-bg/80 backdrop-blur-xl">
      <div className="container-site flex h-16 items-center justify-between gap-4">
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
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:block">
            <Button href="/contact" size="sm">
              {SITE.cta}
            </Button>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-edge text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-edge bg-surface/95 px-6 py-5 backdrop-blur-xl md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-surface-soft"
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
