"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";

type TimelineStep = {
  id: number;
  time: string;
  title: string;
  detail: string;
};

type Signals = { urgency: string; quantity: string; stage: string; score: number; intent: string; budget: string };

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function extractSignals(message: string): Signals {
  const lower = message.toLowerCase();
  const urgency =
    (lower.match(/end of month/)?.[0] ??
      lower.match(/this week/)?.[0] ??
      lower.match(/asap/)?.[0] ??
      lower.match(/deadline/)?.[0] ??
      lower.match(/urgent/)?.[0] ??
      lower.match(/soon/)?.[0] ??
      "not stated") || "not stated";

  const quantityMatch = lower.match(/(\d+)\s*(units|pcs|pieces|items|hoodies|boxes|seats|chairs)/);
  const quantity = quantityMatch ? `${quantityMatch[1]} ${quantityMatch[2]}` : "not stated";

  const stage = lower.match(/pricing|quote|price|cost/)
    ? "pricing request"
    : lower.match(/demo|trial|walkthrough/)
      ? "demo request"
      : lower.match(/\?/)
        ? "questions"
        : "researching";

  const hasBudget = /budget|price|pricing|cost|spend/.test(lower);
  const hasQuantity = /(\d+)\s*(units|pcs|pieces|items|hoodies)/.test(lower);
  const hasUrgency = /end of month|this week|asap|deadline|urgent|soon/.test(lower);

  let score = 5;
  if (hasBudget) score += 2;
  if (hasQuantity) score += 1;
  if (hasUrgency) score += 2;
  if (/by|before/.test(lower) && hasUrgency) score += 1;
  score = Math.min(10, score);

  return {
    urgency,
    quantity,
    stage,
    score,
    intent: score >= 8 ? "high" : score >= 6 ? "medium" : "low",
    budget: hasBudget ? "strong" : "weak",
  };
}

export default function LeadResponse() {
  const [message, setMessage] = useState(
    "Hi, I saw your website. We need pricing for 20 branded hoodies by end of month. What's your turnaround?"
  );
  const [name, setName] = useState("Sarah Mitchell");
  const [email, setEmail] = useState("sarah@northpeak.co.uk");
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [signals, setSignals] = useState<Signals | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const runRef = useRef(0);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (running || message.trim().length < 10) return;
    markInteracted();
    const run = ++runRef.current;
    setRunning(true);
    setSteps([]);
    setDraft(null);
    const sig = extractSignals(message);
    setSignals(sig);
    const firstName = name.trim().split(" ")[0] || "there";

    const replyDraft = `Hi ${firstName}, thanks for reaching out!\n\n${sig.quantity !== "not stated" ? `${sig.quantity} ${sig.stage} by ${sig.urgency === "not stated" ? "your deadline" : sig.urgency} is very doable — we've got capacity this month.` : `We can definitely help with your ${sig.stage}.`} I'll send a tailored breakdown today with per-unit pricing and turnaround.\n\nWhat's the best email to send the quote to?\n\n— Nexus Automations`;

    const plan: Omit<TimelineStep, "id">[] = [
      { time: "12:41", title: "Lead received via website form", detail: `From: ${name.trim() || "Anonymous"} · ${email.trim() || "no email"}` },
      {
        time: "12:41",
        title: "AI scores lead",
        detail: `Score ${sig.score}/10 · intent: ${sig.intent} · budget signal: ${sig.budget}`,
      },
      { time: "12:42", title: "Personalized reply drafted", detail: "OpenAI writes a reply from your brand voice + lead context" },
      { time: "12:42", title: "Lead saved to CRM (HubSpot)", detail: "Contact created with score, stage and source" },
      { time: "12:42", title: "Team alerted on Slack", detail: "#leads-hot pinged — reply within 5 minutes" },
    ];

    for (const step of plan) {
      await delay(850 + Math.random() * 450);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);
      if (step.title.startsWith("Personalized")) setDraft(replyDraft);
    }
    setRunning(false);
  };

  const reset = () => {
    runRef.current += 1;
    setSteps([]);
    setSignals(null);
    setDraft(null);
    setRunning(false);
  };

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e]"
    >
      {/* Lead form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="border-b border-white/10 bg-[#111111] px-5 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
          Step 1 — paste a lead message
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] p-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#25D366]/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Lead name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-[#25D366]/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/50">Lead email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white outline-none focus:border-[#25D366]/60"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={running}
            className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#1fb958] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running…" : "Run the response flow →"}
          </button>
          {steps.length > 0 && !running && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:border-white/25 hover:text-white"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        {/* Timeline */}
        <div className="border-b border-white/10 px-5 py-5 lg:border-r lg:border-b-0">
          <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Step 2 — what happens automatically
          </p>
          {steps.length === 0 && !running ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-white/60">
              Hit &quot;Run the response flow&quot; — every step below is what n8n does in production.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-black">
                      ✓
                    </span>
                    {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-white/10" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-mono text-[11px] text-[#25D366]">{step.time}</p>
                    <p className="text-sm font-medium text-white">{step.title}</p>
                    <p className="mt-0.5 text-xs text-white/45">{step.detail}</p>
                  </div>
                </li>
              ))}
              {running && (
                <li className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#25D366]" />
                  <span className="text-sm text-white/50">Processing…</span>
                </li>
              )}
            </ol>
          )}
        </div>

        {/* Signals + draft */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Signals extracted
          </p>
          {signals ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1 text-xs font-medium text-[#25D366]">
                ⚡ urgency: {signals.urgency}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                📦 quantity: {signals.quantity}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                🧭 stage: {signals.stage}
              </span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-white/50">Extracted from the lead message when you run the flow.</p>
          )}

          <p className="mt-5 text-[10px] font-semibold tracking-widest text-white/60 uppercase">
            Reply draft
          </p>
          {draft ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0a0a0a] p-4 font-sans text-sm leading-relaxed text-white/85">
              {draft}
            </pre>
          ) : (
            <p className="mt-3 text-xs text-white/50">The AI-written reply lands here after scoring.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-3">
        <p className="text-xs leading-relaxed text-white/60">
          <span className="font-semibold text-white/70">What&apos;s real here:</span> production = n8n webhook + OpenAI
          scoring + HubSpot/Airtable + Slack alert. Same pipeline, real tools — the scoring and drafting above are
          simulated locally.
        </p>
      </div>
    </div>
  );
}
