"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Button from "./Button";
import Icon from "./icons";
import { SITE } from "./config";

// Public by design (docs.web3forms.com). Sign up, create a form, copy the access key, paste above.
const WEB3FORMS_ACCESS_KEY: string = "b9453e95-f372-4bfa-a7b7-74c5e6141323";
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

// No key configured yet: keep the mailto fallback so the site never breaks.
const WEB3FORMS_IS_SET =
  WEB3FORMS_ACCESS_KEY.length > 0 && WEB3FORMS_ACCESS_KEY !== "PASTE_KEY_HERE";

const inputCls =
  "w-full rounded-xl border border-edge bg-surface-soft px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-wa/50 focus:outline-none focus:ring-2 focus:ring-wa/20";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

type Status = "idle" | "sending" | "sent";

export default function AuditForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: bots fill the hidden field, humans cannot see it. If it is
    // filled, pretend success and do nothing.
    const botcheck = String(data.get("botcheck") ?? "");
    if (botcheck) {
      setStatus("sent");
      return;
    }

    const name = String(data.get("name") ?? "");
    const business = String(data.get("business") ?? "");
    const contact = String(data.get("contact") ?? "");
    const tasks = String(data.get("tasks") ?? "");

    // No Web3Forms key yet: fall back to the pre-filled mailto so the form
    // still works until the access key is pasted above.
    if (!WEB3FORMS_IS_SET) {
      const subject = encodeURIComponent("Free automation audit request");
      const body = encodeURIComponent(
        `Name: ${name}\nBusiness: ${business}\nContact: ${contact}\n\nTasks that eat my week:\n${tasks}`,
      );
      setStatus("sending");
      window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
      window.setTimeout(() => setStatus("sent"), 600);
      return;
    }

    setStatus("sending");
    setError(null);
    try {
      const payload = new FormData();
      payload.set("access_key", WEB3FORMS_ACCESS_KEY);
      payload.set("subject", "Free automation audit request");
      payload.set("name", name);
      payload.set("business", business);
      payload.set("contact", contact);
      payload.set("tasks", tasks);
      payload.set("botcheck", botcheck);

      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: payload,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Web3Forms returned ${res.status}`);
      }

      setStatus("sent");
    } catch {
      setError(
        "Could not send your request. Please try again, or message us on WhatsApp and we will pick it up right away.",
      );
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-start justify-center gap-4 rounded-2xl border border-wa/25 bg-wa/[0.06] p-8"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-wa text-wa-ink">
          <Icon name="check" className="h-6 w-6" />
        </span>
        <h3 className="text-2xl font-semibold tracking-tight text-ink">Request sent.</h3>
        <p className="text-sm leading-relaxed text-muted">
          We reply within one business day, usually faster.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          If you prefer to talk now,{" "}
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-wa underline underline-offset-2"
          >
            WhatsApp us
          </a>
          .
        </p>
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* Honeypot: hidden from humans, bots fill it. Kept empty on purpose. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Leave this field empty
          <input type="text" name="botcheck" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jordan Smith"
            className={inputCls}
          />
        </Field>
        <Field label="Business" htmlFor="business">
          <input
            id="business"
            name="business"
            type="text"
            placeholder="Your business name"
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Email or WhatsApp" htmlFor="contact">
        <input
          id="contact"
          name="contact"
          type="text"
          required
          placeholder="you@business.com or +1 (555) 000-0000"
          className={inputCls}
        />
      </Field>
      <Field label="Which tasks eat most of your week?" htmlFor="tasks">
        <textarea
          id="tasks"
          name="tasks"
          required
          rows={5}
          placeholder="e.g. I retype every invoice into a spreadsheet, and I answer the same five WhatsApp questions all day…"
          className={`${inputCls} min-h-32 resize-y`}
        />
      </Field>
      <div role="status" aria-live="polite" className="grid gap-3">
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {status === "sending"
              ? WEB3FORMS_IS_SET
                ? "Sending…"
                : "Opening your mail app…"
              : "Send my audit request"}
          </Button>
          <p className="text-xs text-muted">No spam, ever. We reply within one business day.</p>
        </div>
      </div>
    </form>
  );
}
