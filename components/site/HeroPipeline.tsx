"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Icon, { type IconName } from "./icons";

/**
 * Animated "pipeline" card for the hero. Pure CSS + React state, no libs.
 * - Cycling typewriter of business problems the pipeline solves
 * - A looping progress simulation: one order travels through four stages,
 *   connectors fill as it moves, status chips flip, the counter ticks up
 * - Runs for everyone. Under prefers-reduced-motion the order advances
 *   stepwise with opacity-only fades: no sliding dot, no scale travel
 * - Fixed-height rows so nothing shifts on load
 */

const PROBLEMS = [
  "Invoices eating your week?",
  "Missed calls after hours?",
  "Leads left on read?",
  "Orders lost to slow replies?",
];

const STAGES: { icon: IconName; title: string; note: string }[] = [
  { icon: "message", title: "Order arrives", note: "Customer messages at any hour" },
  { icon: "zap", title: "AI captures it", note: "Product, size, address extracted" },
  { icon: "card", title: "Payment verified", note: "Confirmed in seconds" },
  { icon: "send", title: "Delivered + tracked", note: "Courier booked, customer updated" },
];

const ROTATING_METRICS = [
  "Reply in under 5 seconds",
  "Save 10+ hours a week",
  "Launch in under 5 minutes",
  "Typical results shown",
];

const STAGE_MS = 2000; // time per stage, including the "all done" beat
const FILL_MS = STAGE_MS - 200; // connector + dot travel time, synced to the tick
const METRIC_MS = 3600; // rotate the status line
const START_ORDERS = 100;
const STAGE_COUNT = STAGES.length;
const DONE_POS = STAGE_COUNT; // pos value meaning "all stages complete"

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
      // Stepwise: swap the whole phrase on a fade, no character typing.
      let alive = true;
      let timer = 0;
      const cycle = () => {
        timer = window.setTimeout(() => {
          if (!alive) return;
          setIndex((i) => (i + 1) % phrases.length);
          cycle();
        }, 2600);
      };
      cycle();
      return () => {
        alive = false;
        window.clearTimeout(timer);
      };
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

  return reduced ? phrases[index % phrases.length] : display;
}

type StageState = "done" | "active" | "queued";

export default function HeroPipeline() {
  const reduced = usePrefersReducedMotion();
  const typed = useTypewriter(PROBLEMS, reduced);
  const [pos, setPos] = useState(0);
  const [orders, setOrders] = useState(START_ORDERS);
  const [metricIdx, setMetricIdx] = useState(0);
  const posRef = useRef(0);

  // Loop the order through the stages for everyone. A chained timeout
  // (not an interval) advances one stage at a time, so a backgrounded tab
  // resumes cleanly: the next tick fires once when the tab is visible again.
  useEffect(() => {
    let alive = true;
    let timer = 0;
    let lastTick = performance.now();

    const advance = () => {
      const next = (posRef.current + 1) % (DONE_POS + 1);
      posRef.current = next;
      setPos(next);
      if (next === 0) setOrders((o) => o + 1);
    };

    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!alive) return;
        lastTick = performance.now();
        advance();
        schedule();
      }, STAGE_MS);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (performance.now() - lastTick >= STAGE_MS) {
        window.clearTimeout(timer);
        lastTick = performance.now();
        advance();
        schedule();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Rotate the status line on the metric strip, same chained pattern.
  useEffect(() => {
    let alive = true;
    let timer = 0;
    const cycle = () => {
      timer = window.setTimeout(() => {
        if (!alive) return;
        setMetricIdx((i) => (i + 1) % ROTATING_METRICS.length);
        cycle();
      }, METRIC_MS);
    };
    cycle();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const allDone = pos === DONE_POS;

  function stageState(i: number): StageState {
    if (allDone) return "done";
    if (i < pos) return "done";
    if (i === pos) return "active";
    return "queued";
  }

  // Connector i sits between stage i and stage i + 1. Normal motion fills
  // it with a scaleX slide; reduced motion lights it up with an opacity fade.
  function fillStyle(i: number): CSSProperties {
    const filling = pos === i + 1;
    const on = filling || Math.min(pos, DONE_POS) >= i + 2;
    if (reduced) {
      return {
        opacity: on ? 1 : 0,
        transition: filling ? "opacity 350ms ease" : "none",
      };
    }
    return {
      transform: `scaleX(${on ? 1 : 0})`,
      transition: filling ? `transform ${FILL_MS}ms linear` : "none",
    };
  }

  const dotPct = pos === 0 ? 0 : allDone ? 1 : pos / (DONE_POS - 1);
  const dotTransition = pos === 0 ? "none" : `transform ${FILL_MS}ms linear`;

  const activeNote = allDone
    ? "Order complete. Next one rolls in…"
    : STAGES[pos].note;

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
            n8n · simulated preview
          </span>
        </div>

        {/* Cycling typewriter line, fixed height, no layout shift */}
        <div className="mt-5 flex h-7 items-center gap-2" aria-hidden="true">
          <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Solves:
          </span>
          {reduced ? (
            <span key={typed} className="animate-fade-in truncate text-sm font-medium text-ink">
              {typed}
            </span>
          ) : (
            <span className="truncate text-sm font-medium text-ink">{typed}</span>
          )}
          <span className="h-4 w-[2px] shrink-0 animate-caret bg-wa" />
        </div>

        {/* Looping pipeline stepper */}
        <div className="relative mt-5 h-[86px] [container-type:inline-size]" aria-hidden="true">
          {/* connector track */}
          <div className="absolute inset-x-7 top-[18px] h-[3px] rounded-full bg-edge" />
          {/* fill segments, scale in from the left as the order moves */}
          <div className="absolute inset-x-7 top-[18px] h-[3px]">
            <div className="flex h-full">
              {[0, 1, 2].map((i) => {
                const s = fillStyle(i);
                return (
                  <div key={i} className="h-full flex-1 overflow-hidden">
                    <div
                      className="fill-fade h-full w-full origin-left bg-linear-to-r from-wa to-sky"
                      style={s}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* traveling order dot (hidden under reduced motion) */}
          {!reduced ? (
            <span
              className="absolute top-[13px] z-10 h-3.5 w-3.5 rounded-full bg-wa shadow-[0_0_14px_rgba(37,211,102,0.7)]"
              style={{
                transform: `translateX(calc(28px + (100cqw - 56px) * ${dotPct} - 7px))`,
                transition: dotTransition,
              }}
            />
          ) : null}
          {/* stage nodes */}
          {STAGES.map((stage, i) => {
            const state = stageState(i);
            return (
              <div
                key={stage.title}
                className="absolute top-0 flex w-[72px] -translate-x-1/2 flex-col items-center gap-1"
                style={{ left: `calc(28px + (100% - 56px) * ${i / (DONE_POS - 1)})` }}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full border transition-colors duration-300 ${
                    state === "done"
                      ? "border-wa bg-wa text-wa-ink"
                      : state === "active"
                        ? "border-wa/60 bg-wa/15 text-wa"
                        : "border-edge bg-surface text-muted"
                  }`}
                >
                  {state === "done" ? (
                    <Icon name="check" className="h-4 w-4" />
                  ) : state === "active" ? (
                    <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-wa" />
                  ) : (
                    <Icon name={stage.icon} className="h-4 w-4" />
                  )}
                </span>
                <p
                  className={`w-full truncate text-center text-[10px] font-medium leading-tight ${
                    state === "queued" ? "text-muted" : "text-ink"
                  }`}
                >
                  {stage.title}
                </p>
                <p
                  className={`font-mono text-[9px] uppercase tracking-wider ${
                    state === "done" || state === "active" ? "text-wa" : "text-muted/70"
                  }`}
                >
                  {state === "done" ? "Done" : state === "active" ? "Running" : "Queued"}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active stage note, fixed height, no layout shift */}
        <div className="mt-3 flex h-5 items-center justify-center gap-2" aria-hidden="true">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-wa" />
          <p key={activeNote} className="animate-fade-in truncate text-xs text-muted">
            {activeNote}
          </p>
        </div>

        {/* Live metric strip, fixed height, no layout shift */}
        <div className="mt-3 flex h-11 items-center justify-between gap-3 rounded-xl border border-edge bg-surface-soft px-4">
          <span className="min-w-0 truncate text-xs text-muted">Simulated orders</span>
          <span className="flex shrink-0 items-baseline gap-2 font-mono text-sm font-semibold text-ink">
            <span
              key={orders}
              className={`inline-block tabular-nums ${reduced ? "" : "animate-pop"}`}
              aria-hidden="true"
            >
              {orders}
            </span>
            <span
              key={metricIdx}
              className="animate-fade-in max-w-40 truncate text-[10px] font-normal text-muted"
            >
              {ROTATING_METRICS[metricIdx % ROTATING_METRICS.length]}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
