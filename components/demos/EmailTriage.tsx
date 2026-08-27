"use client";

import { useCallback, useRef, useState } from "react";

type Step = { id: number; time: string; title: string; detail: string };
type Category = "lead" | "invoice" | "spam";
type EmailStatus = "unread" | "classified" | "drafted" | "sent" | "logged" | "archived" | "held";
type Email = {
  id: number;
  from: string;
  subject: string;
  preview: string;
  time: string;
  category: Category | null;
  priority: number | null;
  draft: string | null;
  status: EmailStatus;
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const INITIAL: Email[] = [
  {
    id: 1,
    from: "Alex Chen <alex@northstar.io>",
    subject: "Pricing for annual license",
    preview: "Hi, we are comparing tools for a 40-person team. Could you send pricing for an annual plan by Friday?",
    time: "09:12",
    category: null,
    priority: null,
    draft: null,
    status: "unread",
  },
  {
    id: 2,
    from: "Acme Supplies <billing@acmesupplies.de>",
    subject: "Invoice INV-2026-0441",
    preview: "Invoice attached for March: 1,485.12 EUR incl. 19% VAT. Due 30 April.",
    time: "08:47",
    category: null,
    priority: null,
    draft: null,
    status: "unread",
  },
  {
    id: 3,
    from: "Prize Center <winner@prize-now.xyz>",
    subject: "You have won $5,000!",
    preview: "Congratulations! Claim your prize now.",
    time: "07:03",
    category: null,
    priority: null,
    draft: null,
    status: "unread",
  },
];

const CLASSIFICATIONS: Record<number, { category: Category; priority: number; draft: string }> = {
  1: {
    category: "lead",
    priority: 1,
    draft:
      "Hi Alex, thanks for reaching out. I can send annual pricing for your 40-person team today. What is the best email for the quote?",
  },
  2: { category: "invoice", priority: 2, draft: "" },
  3: { category: "spam", priority: 3, draft: "" },
};

function chipClass(c: Category): string {
  if (c === "lead")
    return "rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent";
  if (c === "invoice")
    return "rounded-full border border-sky/40 bg-sky/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky";
  return "rounded-full border border-edge bg-surface-soft px-2.5 py-0.5 text-[10px] font-semibold text-muted line-through";
}

export default function EmailTriage() {
  const [emails, setEmails] = useState<Email[]>(() => INITIAL.map((e) => ({ ...e })));
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const runRef = useRef(0);

  const markInteracted = useCallback(() => setInteracted(true), []);
  const leadEmail = emails.find((e) => e.draft) ?? null;

  const runTriage = async () => {
    if (running) return;
    markInteracted();
    const run = ++runRef.current;
    setRunning(true);
    setSteps([]);
    setAwaitingApproval(false);

    const plan: Omit<Step, "id">[] = [
      { time: "10:02", title: "Gmail watch: 3 new messages", detail: "unread mail pulled at 09:12" },
      { time: "10:02", title: "AI classifies each message", detail: "lead, invoice and spam detected" },
      { time: "10:03", title: "Priority ranked", detail: "lead first, invoice second, spam archived" },
      { time: "10:03", title: "Draft written for the lead", detail: "awaiting your approval before anything sends" },
    ];

    for (const step of plan) {
      await delay(850 + Math.random() * 400);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);

      if (step.title.startsWith("AI classifies")) {
        for (const em of INITIAL) {
          await delay(650 + Math.random() * 350);
          if (runRef.current !== run) return;
          const c = CLASSIFICATIONS[em.id];
          setEmails((prev) =>
            prev.map((e) => (e.id === em.id ? { ...e, category: c.category, status: "classified" } : e))
          );
        }
      }
      if (step.title.startsWith("Priority ranked")) {
        setEmails((prev) =>
          prev.map((e) => (e.id === 1 ? { ...e, priority: 1 } : e.id === 2 ? { ...e, priority: 2 } : e))
        );
      }
      if (step.title.startsWith("Draft written")) {
        setEmails((prev) =>
          prev.map((e) => (e.id === 1 ? { ...e, draft: CLASSIFICATIONS[1].draft, status: "drafted" } : e))
        );
        setAwaitingApproval(true);
      }
    }
    setRunning(false);
  };

  const approve = async () => {
    if (running || !awaitingApproval) return;
    const run = ++runRef.current;
    setRunning(true);
    setAwaitingApproval(false);
    markInteracted();

    const plan: Omit<Step, "id">[] = [
      { time: "10:04", title: "Reply sent to Alex Chen", detail: "Gmail: sent from your address" },
      { time: "10:04", title: "Invoice logged to invoices_2026", detail: "sheet row appended, no reply needed" },
      { time: "10:04", title: "Spam moved to trash", detail: "no reply needed" },
      { time: "10:05", title: "Exchange logged to HubSpot timeline", detail: "lead and invoice contact updated" },
    ];

    for (const step of plan) {
      await delay(800 + Math.random() * 350);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);
      if (step.title.startsWith("Reply sent")) {
        setEmails((prev) => prev.map((e) => (e.id === 1 ? { ...e, status: "sent" } : e)));
      }
      if (step.title.startsWith("Invoice logged")) {
        setEmails((prev) => prev.map((e) => (e.id === 2 ? { ...e, status: "logged" } : e)));
      }
      if (step.title.startsWith("Spam moved")) {
        setEmails((prev) => prev.map((e) => (e.id === 3 ? { ...e, status: "archived" } : e)));
      }
    }
    setRunning(false);
  };

  const hold = async () => {
    if (running || !awaitingApproval) return;
    const run = ++runRef.current;
    setRunning(true);
    setAwaitingApproval(false);
    markInteracted();

    const plan: Omit<Step, "id">[] = [
      { time: "10:04", title: "Draft held, nothing sent", detail: "kept for a manual follow-up" },
      { time: "10:04", title: "Invoice logged to invoices_2026", detail: "sheet row appended, no reply needed" },
      { time: "10:04", title: "Spam moved to trash", detail: "no reply needed" },
    ];

    for (const step of plan) {
      await delay(800 + Math.random() * 350);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);
      if (step.title.startsWith("Draft held")) {
        setEmails((prev) => prev.map((e) => (e.id === 1 ? { ...e, status: "held" } : e)));
      }
      if (step.title.startsWith("Invoice logged")) {
        setEmails((prev) => prev.map((e) => (e.id === 2 ? { ...e, status: "logged" } : e)));
      }
      if (step.title.startsWith("Spam moved")) {
        setEmails((prev) => prev.map((e) => (e.id === 3 ? { ...e, status: "archived" } : e)));
      }
    }
    setRunning(false);
  };

  const reset = () => {
    runRef.current += 1;
    setEmails(INITIAL.map((e) => ({ ...e })));
    setSteps([]);
    setRunning(false);
    setAwaitingApproval(false);
  };

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-edge bg-surface"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge bg-surface-2 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-sm">✉️</span>
          <div>
            <p className="text-sm font-semibold text-ink">Email Triage</p>
            <p className="text-[11px] text-muted">Gmail watch + AI triage + human approval</p>
          </div>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          Simulation
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge bg-surface-2 px-5 py-3">
        <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
          Step 1, pull new mail
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => void runTriage()}
            disabled={running}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running…" : steps.length === 0 ? "Run the triage →" : "Re-run triage →"}
          </button>
          {steps.length > 0 && !running && (
            <button
              onClick={reset}
              className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium text-muted hover:border-edge-strong hover:text-ink"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        {/* Timeline */}
        <div className="border-b border-edge px-5 py-5 lg:border-r lg:border-b-0">
          <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
            Step 2, what happens automatically
          </p>
          {steps.length === 0 && !running ? (
            <p className="mt-4 rounded-xl border border-dashed border-edge bg-surface-soft px-4 py-6 text-center text-sm text-muted">
              Hit &quot;Run the triage&quot;, every step below is what n8n does in production.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                      ✓
                    </span>
                    {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-edge" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-mono text-[11px] text-accent">{step.time}</p>
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
              {running && (
                <li className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge-strong border-t-accent" />
                  <span className="text-sm text-muted">Processing…</span>
                </li>
              )}
            </ol>
          )}
        </div>

        {/* Inbox */}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Inbox (simulated)</p>
            <span className="rounded-full border border-edge bg-surface-soft px-2.5 py-0.5 font-mono text-[10px] text-muted">
              Gmail
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {emails.map((em) => (
              <li
                key={em.id}
                className={`rounded-xl border p-3 transition-opacity ${
                  em.status === "archived" ? "border-edge opacity-60" : "border-edge bg-surface-soft"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{em.from}</p>
                    <p className="truncate text-xs text-ink/90">{em.subject}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{em.preview}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{em.time}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {em.category ? (
                    <span className={chipClass(em.category)}>{em.category.toUpperCase()}</span>
                  ) : (
                    <span className="rounded-full border border-edge bg-surface-soft px-2.5 py-0.5 text-[10px] font-medium text-muted">
                      {running ? "classifying…" : "unread"}
                    </span>
                  )}
                  {em.priority !== null && em.category !== "spam" && (
                    <span className="rounded-full border border-edge bg-surface-soft px-2.5 py-0.5 font-mono text-[10px] text-muted">
                      P{em.priority}
                    </span>
                  )}
                  {em.status === "drafted" && (
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                      draft ready
                    </span>
                  )}
                  {em.status === "sent" && (
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
                      ✓ replied
                    </span>
                  )}
                  {em.status === "logged" && (
                    <span className="rounded-full border border-sky/40 bg-sky/10 px-2.5 py-0.5 text-[10px] font-medium text-sky">
                      ✓ logged
                    </span>
                  )}
                  {em.status === "archived" && (
                    <span className="rounded-full border border-edge bg-surface-soft px-2.5 py-0.5 text-[10px] font-medium text-muted">
                      archived
                    </span>
                  )}
                  {em.status === "held" && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
                      held
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Human-in-the-loop approval */}
          {leadEmail && leadEmail.draft && leadEmail.status === "drafted" && (
            <div className="mt-4 rounded-xl border border-accent/30 bg-surface-soft p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Draft, human approval needed
              </p>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-edge bg-surface-soft-2 p-3 font-sans text-xs leading-relaxed text-ink">
                {leadEmail.draft}
              </pre>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => void approve()}
                  disabled={running}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
                >
                  Approve and send →
                </button>
                <button
                  onClick={() => void hold()}
                  disabled={running}
                  className="rounded-full border border-edge px-4 py-2 text-xs font-medium text-muted hover:border-edge-strong hover:text-ink"
                >
                  Hold
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-edge bg-surface-soft px-5 py-3">
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink/90">What&apos;s real here:</span> production = Gmail API watch +
          n8n + OpenAI classification, with the draft sent to Slack for a human approval click. On approval the reply
          sends and HubSpot logs the exchange. The inbox above is simulated.
        </p>
      </div>
    </div>
  );
}
