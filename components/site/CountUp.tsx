"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up when it scrolls into view. Uses rAF with an ease-out
 * curve, then holds the final value. Under prefers-reduced-motion it jumps
 * straight to the target so the stat is always visible. No layout shift:
 * add `tabular-nums` on the caller so digit width stays constant.
 */

type CountUpProps = {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Deferred state writes keep react-hooks/set-state-in-effect happy.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t = window.setTimeout(() => setReduced(mq.matches), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      const t = window.setTimeout(() => setDisplay(to), 0);
      return () => window.clearTimeout(t);
    }

    let raf = 0;
    const cancel = () => cancelAnimationFrame(raf);

    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setDisplay(Math.round(easeOutCubic(progress) * to));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setDisplay(to), 0);
      return () => {
        window.clearTimeout(t);
        cancel();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run();
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancel();
    };
  }, [reduced, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
