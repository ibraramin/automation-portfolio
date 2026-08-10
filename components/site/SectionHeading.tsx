import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: Props) {
  const centered = align === "center";
  return (
    <Reveal
      className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}
    >
      <p
        className={`flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-wa ${
          centered ? "justify-center" : ""
        }`}
      >
        <span className="h-1 w-1 rounded-full bg-wa" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.1] xl:text-[3.25rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>
      ) : null}
    </Reveal>
  );
}
