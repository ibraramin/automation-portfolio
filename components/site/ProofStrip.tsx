import Icon, { type IconName } from "./icons";
import Reveal from "./Reveal";

const ITEMS: { icon: IconName; text: string; accent?: "accent" | "sky" }[] = [
  { icon: "clock", text: "GMT+6, replies within one business day", accent: "accent" },
  { icon: "card", text: "EUR / GBP / USD payments via Payoneer" },
  { icon: "server", text: "EU-friendly data handling, minimal tracking", accent: "sky" },
  { icon: "zap", text: "n8n + AI specialists" },
];

export default function ProofStrip() {
  return (
    <section className="border-y border-edge bg-surface-soft/60">
      <div className="container-site grid grid-cols-1 gap-x-10 gap-y-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, index) => {
          const isSky = item.accent === "sky";
          return (
            <Reveal key={item.text} delay={index * 70} duration={500}>
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                    isSky
                      ? "border-sky/25 bg-sky/10 text-sky"
                      : "border-accent/25 bg-accent/10 text-accent"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <p className="text-[13px] leading-snug text-muted">{item.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
