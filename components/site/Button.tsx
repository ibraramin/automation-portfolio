import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  primary:
    "bg-wa text-wa-ink shadow-[0_0_0_1px_rgba(37,211,102,0.25),0_8px_32px_-10px_rgba(37,211,102,0.55)] hover:bg-wa-strong hover:shadow-[0_0_0_1px_rgba(37,211,102,0.45),0_12px_48px_-8px_rgba(37,211,102,0.7)] hover:-translate-y-px active:translate-y-0",
  secondary:
    "border border-edge bg-surface-soft text-ink hover:border-edge-strong hover:bg-surface-soft-2 hover:-translate-y-px active:translate-y-0",
  ghost: "text-muted hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-[52px] px-8 text-[15px]",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  target?: string;
  rel?: string;
  onClick?: () => void;
  ariaLabel?: string;
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  type = "button",
  target,
  rel,
  onClick,
  ariaLabel,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const extra = { onClick, target, rel, "aria-label": ariaLabel };

  if (href) {
    const external = /^(https?:|mailto:|tel:)/.test(href);
    if (external) {
      return (
        <a href={href} className={classes} {...extra}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...extra}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...extra}>
      {children}
    </button>
  );
}
