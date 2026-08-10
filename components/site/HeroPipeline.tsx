"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "./icons";

/**
 * Animated "pipeline" card for the hero. Pure CSS + React state, no libs.
 * - Cycling typewriter of business problems the pipeline "solves"
 * - A looping progress simulation: one order travels through four stages,
 *   connectors fill as it moves, status chips flip, the counter ticks up
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
  { icon: "message", title: "Order arrives", note: "Customer messages at any hour" },
  { icon: "zap", title: "AI captures it", note: "Product, size, address extracted" },
  { icon: "card", title: "Payment verified", note: "Confirmed in seconds" },
  { icon: "send", title: "Delivered + tracked", note: "Courier booked, customer updated" },
];

const STAGE_MS = 2000; // time spent on each stage, including the "all done" beat
const FILL_MS = STAGE_MS - 200; // connector + dot travel time, synced to the stage tick
const START_ORDERS = 142;
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
  const [pos, setPos] = useState(0);
  const [orders, setOrders] = useState(START_ORDERS);
  const posRef = useRef(0);

  // Loop the order through the stages. setState only fires inside the
  // interval callback, never synchronously inside the effect body.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      const next = (posRef.current + 1) % (DONE_POS + 1);
      posRef.current = next;
      setPos(next);
      if (next === 0) setOrders((o) => o + 1);
    }, STAGE_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  // Reduced motion: render the whole pipeline as a static "all done" state.
  useEffect(() => {
    if (!reduced) return;
    const t = window.setTimeout(() => {
      posRef.current = DONE_POS;
      setPos(DONE_POS);
    }, 0);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const allDone = pos === DONE_POS;

  function stageState(i: number): StageState {
    if (allDone) return "done";
    if (i < pos) return "done";
    if (i === pos) return "active";
    return "queued";
  }

  // Connector i sits between stage i and stage i + 1.
  function connector(i: number) {
    const filling = pos === i + 1;
    const filled = Math.min(pos, DONE_POS) >= i + 2;
    return {
      scale: filled || filling ? 1 : 0,
      transition: filling ? `transform ${FILL_MS}ms linear` : "none",
    };
  }

  const dotPct = pos === 0 ? 0 : allDone ? 1 : pos / (DONE_POS - 1);
  const dotTransition = reduced || pos === 0 ? "none" : `transform ${FILL_MS}ms linear`;

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
            n8n · live
          </span>
        </div>

        {/* Cycling typewriter line, fixed height, no layout shift */}
        <div className="mt-5 flex h-7 items-center gap-2" aria-hidden="true">
          <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            Solves:
          </span>
          <span className="truncate text-sm font-medium text-ink">{typed}</span>
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
                const c = connector(i);
                return (
                  <div key={i} className="h-full flex-1 overflow-hidden">
                    <div
                      className="h-full w-full origin-left bg-linear-to-r from-wa to-sky"
                      style={{ transform: `scaleX(${c.scale})`, transition: c.transition }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* traveling order dot */}
          <span
            className="absolute top-[13px] z-10 h-3.5 w-3.5 rounded-full bg-wa shadow-[0_0_14px_rgba(37,211,102,0.7)]"
            style={{
              transform: `translateX(calc(28px + (100cqw - 56px) * ${dotPct} - 7px))`,
              transition: dotTransition,
            }}
          />
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
          <p className="truncate text-xs text-muted">{activeNote}</p>
        </div>

        {/* Live metric strip, fixed height, no layout shift */}
        <div className="mt-3 flex h-11 items-center justify-between gap-3 rounded-xl border border-edge bg-surface-soft px-4">
          <span className="truncate text-xs text-muted">Orders handled today</span>
          <span className="flex shrink-0 items-baseline gap-2 font-mono text-sm font-semibold text-ink">
            <span key={orders} className="animate-pop inline-block tabular-nums" aria-hidden="true">
              {orders}
            </span>
            <span className="text-[10px] font-normal text-muted">avg reply 3.2 s</span>
          </span>
        </div>
      </div>
    </div>
  );
}
