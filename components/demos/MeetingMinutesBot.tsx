"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";

type Step = { id: number; time: string; title: string; detail: string };
type ActionItem = { owner: string; task: string; deadline: string };
type Minutes = {
  title: string;
  decisions: string[];
  actions: ActionItem[];
  deadlineNotes: string[];
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const SAMPLES: { label: string; title: string; text: string }[] = [
  {
    label: "Q3 launch sync",
    title: "Q3 launch sync",
    text: `Sarah: Let's start. The Q3 launch is the priority.
Ravi: Agreed. The landing page has to be live by the 20th.
Sarah: Ravi, can you own the landing page?
Ravi: Yes, I will handle it.
Mei: I will take the email sequence, I need copy from Tom.
Tom: Copy goes to Mei by Friday.
Sarah: Budget is 120k for the quarter, is that enough?
Mei: 120k is tight but workable.
Sarah: Decision made, 120k confirmed. Next call Thursday at 10 AM.`,
  },
  {
    label: "Client kickoff",
    title: "Client kickoff: GreenLeaf",
    text: `Amina: Welcome. The goal is a working automation by end of month.
David: We will start with the invoice flow, it has the highest pain.
Amina: David, you own the invoice flow?
David: Yes, I will own it.
Amina: I will handle the reporting side, weekly metrics to the client.
David: Deadline for the first demo is next Tuesday.`,
  },
];

const ACTION_RE = /i'?ll (take|handle|own|do|send|write|prepare|set up)|i will (take|handle|own|do|send)/i;
const DECISION_RE = /decision|agreed|confirmed|we'll|let's|priorit|go with/i;

function parseTurn(line: string): { speaker: string; speech: string } | null {
  const m = line.match(/^([A-Za-z][A-Za-z .'-]{0,24}):\s*(.+)$/);
  if (!m) return null;
  return { speaker: m[1].trim(), speech: m[2].trim() };
}

function extractMinutes(text: string, fallbackTitle: string): Minutes {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const decisions: string[] = [];
  const actions: ActionItem[] = [];
  const deadlineNotes: string[] = [];
  const seen = new Set<string>();

  const deadlineOf = (s: string): string => {
    const m = s.match(/(?:by|before)\s+(?:the\s+)?([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,3})/i);
    return m ? `by ${m[1].toLowerCase()}` : "asap";
  };

  for (const line of lines) {
    const turn = parseTurn(line);
    if (!turn) continue;
    const content = turn.speech;

    if (DECISION_RE.test(content) && decisions.length < 4) {
      const key = content.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        decisions.push(content);
      }
    }
    if (ACTION_RE.test(content) && actions.length < 5) {
      actions.push({ owner: turn.speaker, task: content, deadline: deadlineOf(content) });
    }
  }

  const dlRe = /\b(?:by|before)\s+(?:the\s+)?([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+){0,3})/gi;
  let mm: RegExpExecArray | null;
  const dl = new Set<string>();
  while ((mm = dlRe.exec(text)) !== null) dl.add(`by ${mm[1].toLowerCase()}`);
  for (const d of dl) if (deadlineNotes.length < 4) deadlineNotes.push(d);

  return { title: fallbackTitle, decisions: decisions.slice(0, 4), actions: actions.slice(0, 5), deadlineNotes };
}

export default function MeetingMinutesBot() {
  const [transcript, setTranscript] = useState(SAMPLES[0].text);
  const [title, setTitle] = useState(SAMPLES[0].title);
  const [steps, setSteps] = useState<Step[]>([]);
  const [minutes, setMinutes] = useState<Minutes | null>(null);
  const [running, setRunning] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const runRef = useRef(0);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const pickSample = (i: number) => {
    setTranscript(SAMPLES[i].text);
    setTitle(SAMPLES[i].title);
  };

  const handleRun = async (e: FormEvent) => {
    e.preventDefault();
    if (running || transcript.trim().length < 30) return;
    markInteracted();
    const run = ++runRef.current;
    setRunning(true);
    setSteps([]);
    setMinutes(null);

    const parsed = extractMinutes(transcript, title.trim() || "Team meeting");
    setMinutes(parsed);

    const speakers = new Set(
      transcript
        .split("\n")
        .map((l) => parseTurn(l)?.speaker)
        .filter(Boolean)
    );

    const plan: Omit<Step, "id">[] = [
      { time: "14:02", title: "Audio transcribed (Whisper)", detail: `${speakers.size} speakers detected, timestamps ready` },
      { time: "14:02", title: "AI reads the transcript", detail: "Decisions and action items located" },
      { time: "14:03", title: "Minutes drafted", detail: `${parsed.decisions.length} decisions, ${parsed.actions.length} action items` },
      { time: "14:03", title: "Posted to Notion", detail: `Page created: Meeting minutes, ${parsed.title}` },
      { time: "14:04", title: "Posted to Slack", detail: "#minutes: summary and action items" },
    ];

    for (const step of plan) {
      await delay(900 + Math.random() * 400);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);
    }
    setRunning(false);
  };

  const reset = () => {
    runRef.current += 1;
    setSteps([]);
    setMinutes(null);
    setRunning(false);
  };

  const done = steps.length;

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-edge bg-surface"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge bg-surface-2 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-wa/15 text-sm">📝</span>
          <div>
            <p className="text-sm font-semibold text-ink">Meeting Minutes Bot</p>
            <p className="text-[11px] text-muted">Transcript to Notion + Slack</p>
          </div>
        </div>
        <span className="rounded-full border border-wa/30 bg-wa/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-wa">
          Simulation
        </span>
      </div>

      {/* Transcript input */}
      <form onSubmit={(e) => void handleRun(e)} className="border-b border-edge bg-surface-2 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
            Step 1, paste a transcript
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => pickSample(i)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  title === s.title
                    ? "border-wa/50 bg-wa/10 text-wa"
                    : "border-edge bg-surface-soft text-muted hover:border-edge-strong"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={7}
          placeholder="Paste a raw meeting transcript, one speaker turn per line..."
          className="mt-3 w-full rounded-xl border border-edge bg-surface-soft p-3 font-mono text-xs leading-relaxed text-ink placeholder:text-muted/60 outline-none focus:border-wa/60"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={running || transcript.trim().length < 30}
            className="rounded-full bg-wa px-5 py-2.5 text-sm font-semibold text-wa-ink hover:bg-wa-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running…" : "Run the minutes flow →"}
          </button>
          {(steps.length > 0 || minutes) && !running && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium text-muted hover:border-edge-strong hover:text-ink"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
        {/* Timeline */}
        <div className="border-b border-edge px-5 py-5 lg:border-r lg:border-b-0">
          <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">
            Step 2, what happens automatically
          </p>
          {steps.length === 0 && !running ? (
            <p className="mt-4 rounded-xl border border-dashed border-edge bg-surface-soft px-4 py-6 text-center text-sm text-muted">
              Hit &quot;Run the minutes flow&quot;, every step below is what n8n does in production.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <li key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wa text-xs font-bold text-wa-ink">
                      ✓
                    </span>
                    {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-edge" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-mono text-[11px] text-wa">{step.time}</p>
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{step.detail}</p>
                  </div>
                </li>
              ))}
              {running && (
                <li className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge-strong border-t-wa" />
                  <span className="text-sm text-muted">Processing…</span>
                </li>
              )}
            </ol>
          )}
        </div>

        {/* Minutes output */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Minutes</p>
          {minutes ? (
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink">{minutes.title}</p>
                <p className="font-mono text-[11px] text-muted">
                  {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                  {minutes.actions.length} action items
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Decisions</p>
                <ul className="mt-2 space-y-1.5">
                  {minutes.decisions.map((d, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-ink/90">
                      <span className="mt-0.5 h-3 w-3 shrink-0 rounded-[3px] border border-wa/50 bg-wa/10" />
                      {d}
                    </li>
                  ))}
                  {minutes.decisions.length === 0 && (
                    <li className="text-xs text-muted">No explicit decisions found in this transcript.</li>
                  )}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">Action items</p>
                <div className="mt-2 overflow-hidden rounded-xl border border-edge">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-soft text-[10px] uppercase tracking-widest text-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">Owner</th>
                        <th className="px-3 py-2 font-medium">Task</th>
                        <th className="px-3 py-2 font-medium">Deadline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge">
                      {minutes.actions.map((a, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 align-top font-medium text-wa">{a.owner}</td>
                          <td className="px-3 py-2 align-top leading-relaxed text-ink/90">{a.task}</td>
                          <td className="px-3 py-2 align-top font-mono text-[11px] text-muted">{a.deadline}</td>
                        </tr>
                      ))}
                      {minutes.actions.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-muted">
                            No clear owners in this transcript, AI flags it for review.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {minutes.deadlineNotes.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Deadlines spotted
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {minutes.deadlineNotes.map((d) => (
                      <span
                        key={d}
                        className="rounded-full border border-edge bg-surface-soft px-2.5 py-1 text-[11px] text-ink/90"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                    done >= 4
                      ? "border-wa/40 bg-wa/10 text-wa"
                      : "border-edge bg-surface-soft text-muted"
                  }`}
                >
                  {done >= 4 ? "✓ Notion: page created" : "Notion: pending"}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                    done >= 5
                      ? "border-wa/40 bg-wa/10 text-wa"
                      : "border-edge bg-surface-soft text-muted"
                  }`}
                >
                  {done >= 5 ? "✓ Slack: #minutes posted" : "Slack: pending"}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-edge bg-surface-soft px-4 py-6 text-center text-sm text-muted">
              Minutes, decisions and action items land here after the run.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-edge bg-surface-soft px-5 py-3">
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink/90">What&apos;s real here:</span> production = recording in,
          Whisper transcribes, OpenAI extracts structured minutes, then Notion and Slack get the result. The
          transcription and extraction above are simulated locally.
        </p>
      </div>
    </div>
  );
}
