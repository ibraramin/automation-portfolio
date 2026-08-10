"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Button from "./Button";
import Icon from "./icons";
import { SITE } from "./config";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-wa/50 focus:outline-none focus:ring-2 focus:ring-wa/20";

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const business = String(data.get("business") ?? "");
    const contact = String(data.get("contact") ?? "");
    const tasks = String(data.get("tasks") ?? "");

    const subject = encodeURIComponent("Free automation audit request");
    const body = encodeURIComponent(
      `Name: ${name}\nBusiness: ${business}\nContact: ${contact}\n\nTasks that eat my week:\n${tasks}`,
    );
    setStatus("sending");
    // Opens the visitor's mail app with everything pre-filled. Swap for a form
    // backend (Formspree etc.) later — no server needed for now.
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    setTimeout(() => setStatus("sent"), 600);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start justify-center gap-4 rounded-2xl border border-wa/25 bg-wa/[0.06] p-8">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-wa text-[#04150b]">
          <Icon name="check" className="h-6 w-6" />
        </span>
        <h3 className="text-2xl font-semibold tracking-tight text-ink">Almost there — check your email app.</h3>
        <p className="text-sm leading-relaxed text-muted">
          Your email app should have opened with everything pre-filled — just hit send. We reply
          within one business day, usually faster.
        </p>
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ayesha Rahman"
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
          placeholder="you@business.com or +880 1X XX XX XX XX"
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
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {status === "sending" ? "Opening your mail app…" : "Send my audit request"}
        </Button>
        <p className="text-xs text-muted">Opens your email app, pre-filled. No spam, ever.</p>
      </div>
    </form>
  );
}
