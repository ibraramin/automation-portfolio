"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Fades content in once when it enters the viewport.
 * - IntersectionObserver, threshold 0.15, fires once, then unobserves.
 * - Easing cubic-bezier(0.22, 1, 0.36, 1), 500 to 800ms by default.
 * - Stagger via the `delay` prop (keep under ~300ms per element).
 * - prefers-reduced-motion: renders fully visible, no transitions.
 * - No layout shift: only opacity / transform / filter are animated, and the
 *   element always occupies its space in the layout.
 */

type Variant = "up" | "zoom" | "fade";

type RevealProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
  duration?: number;
  blur?: boolean;
};

export default function Reveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  duration = 700,
  blur = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Deferred state writes keep react-hooks/set-state-in-effect happy.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t = window.setTimeout(() => setReduced(mq.matches), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const eased = "cubic-bezier(0.22, 1, 0.36, 1)";
  const hidden: CSSProperties = {};
  if (variant === "up") hidden.transform = "translateY(24px)";
  if (variant === "zoom") hidden.transform = "scale(0.96)";
  if (blur) hidden.filter = "blur(8px)";
  hidden.opacity = 0;

  const style: CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hidden.transform,
        filter: visible ? "none" : hidden.filter,
        transition: `opacity ${duration}ms ${eased} ${delay}ms, transform ${duration}ms ${eased} ${delay}ms, filter ${duration}ms ${eased} ${delay}ms`,
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
