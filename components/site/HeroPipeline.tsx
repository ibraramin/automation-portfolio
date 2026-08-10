"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "./icons";

/**
 * Animated "pipeline" card for the hero. Pure CSS + React state — no libs.
 * - Cycling typewriter of business problems the pipeline "solves"
 * - 4-stage workflow with a flowing connector rail and pulsing status dots
 * - Respects prefers-reduced-motion (renders a static completed state)
 * - Fixed-height rows so nothing shifts on load
 */

const PROBLEMS = [
  "Invoices eating your week?",
  "Missed calls after hours?",
  "Leads left on read?",
  "Orders lost to slow replies?",
];

const STAGES: { icon: IconName; title: string; note: string }[] = [
  { icon: "message", title: "New order on WhatsApp", note: "Customer messages at any hour" },
  { icon: "zap", title: "AI captures it", note: "Product, size, address extracted" },
  { icon: "card", title: "Payment verified", note: "Confirmed in seconds" },
  { icon: "send", title: "Delivered + tracked", note: "Courier booked, customer updated" },
];

const METRICS = [
  "Avg. first reply: 3.2 seconds",
  "Orders handled today: 142",
  "Invoices filed this week: 17",
  "Leads answered in under 5 min: 38",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t = window.setTimeout(() => setReduced(mq.matches), 0);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", onChange);
    return () => {
      window.clearTimeout(t);
      mq.removeEventListener("change", onChange);
    };
  }, []);
  return reduced;
}

function useTypewriter(phrases: string[], reduced: boolean) {
  const [display, setDisplay] = useState(reduced ? phrases[0] : "");
  const [deleting, setDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => setDisplay(phrases[0]), 0);
      return () => window.clearTimeout(t);
    }
    const current = phrases[index % phrases.length];
    if (!deleting && display === current) {
      const hold = window.setTimeout(() => setDeleting(true), 1600);
      return () => window.clearTimeout(hold);
    }
    if (deleting && display === "") {
      const gap = window.setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, 320);
      return () => window.clearTimeout(gap);
    }
    const delay = deleting ? 26 : 46;
    const tick = window.setTimeout(() => {
      setDisplay(
        deleting
          ? current.slice(0, display.length - 1)
          : current.slice(0, display.length + 1),
      );
    }, delay);
    return () => window.clearTimeout(tick);
  }, [display, deleting, index, phrases, reduced]);

  return display;
}

type StageState = "done" | "active" | "queued";

export default function HeroPipeline() {
  const reduced = usePrefersReducedMotion();
  const typed = useTypewriter(PROBLEMS, reduced);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(
      () => setCycle((c) => (c + 1) % (STAGES.length + 1)),
      2200,
    );
    return () => window.clearTimeout(t);
  }, [cycle, reduced]);

  // In reduced motion show the whole pipeline as completed (static).
  const cycleIndex = reduced ? STAGES.length : cycle;
  const metric = METRICS[cycleIndex % METRICS.length];

  function stageState(i: number): StageState {
    if (cycleIndex >= STAGES.length) return "done";
    if (i < cycleIndex) return "done";
    if (i === cycleIndex) return "active";
    return "queued";
  }

  return (
    <div className="animate-fade-up relative" style={{ animationDelay: "200ms" }}>
      <div
        className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-wa/10 via-transparent to-sky/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-edge bg-surface/90 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-wa" aria-hidden="true" />
            Automation pipeline
          </p>
          <span className="rounded-md border border-edge bg-surface-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            n8n · live
          </span>
        </div>

        {/* Cycling typewriter line — fixed height, no layout shift */}
        <div className="mt-5 flex h-7 items-center gap-2" aria-hidden="true">
          <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Solves:
          </span>
          <span className="truncate text-sm font-medium text-ink">{typed}</span>
          <span className="h-4 w-[2px] shrink-0 animate-caret bg-wa" />
        </div>

        {/* Pipeline timeline */}
        <div className="relative mt-4 pb-1" aria-hidden="true">
          <span className="absolute bottom-4 left-[13px] top-4 w-px bg-edge" />
          <span
            className="absolute bottom-4 left-[13px] top-4 w-px animate-flow-y bg-[linear-gradient(to_bottom,transparent,var(--wa),var(--sky),transparent)] bg-[length:100%_300%]"
            aria-hidden="true"
          />
          <ol className="relative">
            {STAGES.map((stage, i) => {
              const state = stageState(i);
              return (
                <li key={stage.title} className="flex items-center gap-3.5 rounded-xl py-2">
                  <span
                    className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                      state === "done"
                        ? "border-wa bg-wa text-wa-ink"
                        : state === "active"
                          ? "border-wa/60 bg-wa/15 text-wa"
                          : "border-edge bg-surface text-muted"
                    }`}
                  >
                    {state === "done" ? (
                      <Icon name="check" className="h-3.5 w-3.5" />
                    ) : state === "active" ? (
                      <span className="h-2 w-2 animate-pulse-dot rounded-full bg-wa" />
                    ) : (
                      <Icon name={stage.icon} className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[13px] font-medium ${
                        state === "queued" ? "text-muted" : "text-ink"
                      }`}
                    >
                      {stage.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {state === "active" ? `${stage.note} — running…` : stage.note}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase tracking-wider ${
                      state === "done" ? "text-wa" : "text-muted/80"
                    }`}
                  >
                    {state === "done" ? "Done" : state === "active" ? "Running" : "Queued"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Live metric strip — fixed height, no layout shift */}
        <div className="mt-3 flex h-11 items-center justify-between rounded-xl border border-edge bg-surface-soft px-4">
          <span className="text-xs text-muted">Live status</span>
          <span className="font-mono text-sm font-semibold text-ink" aria-hidden="true">
            {metric}
          </span>
        </div>
      </div>
    </div>
  );
}
