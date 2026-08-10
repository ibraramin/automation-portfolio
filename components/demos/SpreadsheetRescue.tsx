"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";

type Step = { id: number; time: string; title: string; detail: string };
type CleanRow = { name: string; email: string; company: string; date: string; amount: string };
type CleanStats = { inputCount: number; uniqueCount: number; removed: number; warnings: string[] };
type CleanResult = { rows: CleanRow[]; stats: CleanStats };

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const SAMPLE_CSV = `Name,Email,Company,Signup Date,Amount
john smith,john@acme.com,Acme,01/05/2026,150
Jane Smith,Jane.Smith@Acme.com,acme,2026-05-01,150
Aisha Karim,aisha@karim.co,Karim Ltd.,05.06.2026,75
JOHN SMITH,john@acme.com,ACME Inc,May 1 2026,150
bob jones,bob@xyz.com,XYZ,15/08/2026,220
mary o'brien,mary@obrien.ie,O'Brien Co,02/09/2026,95`;

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function toIsoDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "needs review";
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  m = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase()];
    if (mo) return `${m[3]}-${mo}-${m[2].padStart(2, "0")}`;
  }
  return "needs review";
}

function titleCase(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      const lower = w.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function cleanCsv(text: string): CleanResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let start = 0;
  if (lines.length && /email|name/i.test(lines[0])) start = 1;

  const rawRows = lines.slice(start).map((l) => l.split(",").map((c) => c.trim()));
  const warnings: string[] = [];
  const rows: CleanRow[] = [];
  const seen = new Set<string>();
  let removed = 0;

  for (const cells of rawRows) {
    if (cells.length < 3) continue;
    const name = titleCase(cells[0] ?? "");
    const email = (cells[1] ?? "").toLowerCase().trim();
    const company = (cells[2] ?? "").replace(/\.$/, "").trim();
    const date = toIsoDate(cells[3] ?? "");
    const amountRaw = (cells[4] ?? "").replace(/[^0-9.]/g, "");
    const amount = amountRaw ? Number(amountRaw).toFixed(2) : "0.00";

    if (!email.includes("@")) warnings.push(`${name || email || "A row"} has an invalid email`);
    if (date === "needs review") warnings.push(`${email || name} has an unreadable date`);
    if (email) {
      if (seen.has(email)) {
        removed += 1;
        continue;
      }
      seen.add(email);
    }
    rows.push({ name, email, company, date, amount });
  }

  return {
    rows,
    stats: { inputCount: rawRows.length, uniqueCount: rows.length, removed, warnings },
  };
}

export default function SpreadsheetRescue() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [steps, setSteps] = useState<Step[]>([]);
  const [clean, setClean] = useState<CleanResult | null>(null);
  const [exported, setExported] = useState<CleanRow[] | null>(null);
  const [running, setRunning] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const runRef = useRef(0);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const handleRun = async (e: FormEvent) => {
    e.preventDefault();
    if (running || csv.trim().length < 20) return;
    markInteracted();
    const run = ++runRef.current;
    setRunning(true);
    setSteps([]);
    setClean(null);
    setExported(null);

    const result = cleanCsv(csv);
    setClean(result);

    const plan: Omit<Step, "id">[] = [
      { time: "15:10", title: "AI reads the mess", detail: `${result.stats.inputCount} rows detected, header mapped` },
      { time: "15:10", title: "Schema suggested", detail: "name, email, company, signup date, amount" },
      { time: "15:11", title: "Deduplicating", detail: `${result.stats.removed} duplicate rows merged by email` },
      { time: "15:11", title: "Standardizing", detail: "names title-cased, dates to ISO, amounts to 2 decimals" },
      {
        time: "15:12",
        title: "Validating rows",
        detail:
          result.stats.warnings.length > 0
            ? `${result.stats.warnings.length} warning${result.stats.warnings.length > 1 ? "s" : ""} flagged for review`
            : "all rows pass",
      },
    ];

    for (const step of plan) {
      await delay(850 + Math.random() * 400);
      if (runRef.current !== run) return;
      setSteps((prev) => [...prev, { ...step, id: prev.length + 1 }]);
    }
    setRunning(false);
  };

  const exportRows = () => {
    if (!clean) return;
    markInteracted();
    setExported(clean.rows);
  };

  const reset = () => {
    runRef.current += 1;
    setSteps([]);
    setClean(null);
    setExported(null);
    setRunning(false);
  };

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111111] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#25D366]/15 text-sm">🧹</span>
          <div>
            <p className="text-sm font-semibold text-white">Spreadsheet Rescue</p>
            <p className="text-[11px] text-white/55">Messy CSV to clean rows</p>
          </div>
        </div>
        <span className="rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#25D366]">
          Simulation
        </span>
      </div>

      {/* CSV input */}
      <form onSubmit={(e) => void handleRun(e)} className="border-b border-white/10 bg-[#111111] px-5 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">
          Step 1, paste a messy CSV
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder="Paste rows from that spreadsheet export nobody wants to fix..."
          className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] p-3 font-mono text-xs leading-relaxed text-white/85 placeholder-white/25 outline-none focus:border-[#25D366]/60"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={running || csv.trim().length < 20}
            className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#1fb958] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Cleaning…" : "Run the cleanup →"}
          </button>
          {(steps.length > 0 || clean) && !running && (
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
            Step 2, what the AI does
          </p>
          {steps.length === 0 && !running ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-white/60">
              Hit &quot;Run the cleanup&quot;, every step below is what n8n does in production.
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
                    <p className="mt-0.5 text-xs text-white/60">{step.detail}</p>
                  </div>
                </li>
              ))}
              {running && (
                <li className="flex items-center gap-3">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#25D366]" />
                  <span className="text-sm text-white/50">Cleaning…</span>
                </li>
              )}
            </ol>
          )}
        </div>

        {/* Clean table */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Clean rows</p>
          {clean ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  in: {clean.stats.inputCount}
                </span>
                <span className="rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1 text-[11px] font-medium text-[#25D366]">
                  unique: {clean.stats.uniqueCount}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  duplicates removed: {clean.stats.removed}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                    clean.stats.warnings.length > 0
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                      : "border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366]"
                  }`}
                >
                  {clean.stats.warnings.length > 0
                    ? `⚠ ${clean.stats.warnings.length} warning${clean.stats.warnings.length > 1 ? "s" : ""}`
                    : "✓ all valid"}
                </span>
              </div>

              <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#111111] text-[10px] uppercase tracking-widest text-white/55">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Company</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-[#0a0a0a]">
                    {clean.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-white/85">{r.name}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-white/70">{r.email}</td>
                        <td className="px-3 py-2 text-white/60">{r.company}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-white/60">{r.date}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[#25D366]">{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {clean.stats.warnings.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {clean.stats.warnings.slice(0, 3).map((w) => (
                    <li key={w} className="text-[11px] text-amber-300/80">
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={exportRows}
                disabled={exported !== null}
                className="mt-4 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#1fb958] disabled:cursor-default disabled:bg-[#25D366]/40"
              >
                {exported ? "Exported to customers_2026.csv ✓" : "Export to CRM / Sheets →"}
              </button>
            </>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-white/60">
              The cleaned, deduplicated table lands here after the run.
            </p>
          )}
        </div>
      </div>

      {/* Export / sheet view */}
      {exported && (
        <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Export view</p>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] text-white/60">
              customers_2026.csv
            </span>
          </div>
          <div className="mt-3 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] text-[10px] uppercase tracking-widest text-white/55">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Signup date</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {exported.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-white/85">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-white/70">{r.email}</td>
                    <td className="px-3 py-2 text-white/60">{r.company}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-white/60">{r.date}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#25D366]">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white/50">
            Production writes the same rows to Supabase or Airtable via n8n, deduplicated against your existing
            contacts.
          </p>
        </div>
      )}

      <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-3">
        <p className="text-xs leading-relaxed text-white/60">
          <span className="font-semibold text-white/70">What&apos;s real here:</span> production = n8n + OpenAI
          structured outputs, then an upsert to Supabase or Airtable with a Google Sheets backup. The cleaning and
          dedupe above run in your browser.
        </p>
      </div>
    </div>
  );
}
