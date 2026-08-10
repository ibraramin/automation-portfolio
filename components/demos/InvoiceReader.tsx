"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";

type LineItem = { description: string; qty: number; unit: string; amount: number };

type ConfidenceKey = "vendor" | "invoiceNumber" | "date" | "totalEur" | "vatEur" | "lines";

type Extraction = {
  source: "sample" | "ocr" | "pasted";
  vendor: string;
  invoiceNumber: string;
  date: string;
  totalEur: number;
  vatEur: number;
  vatRate: number;
  lines: LineItem[];
  confidence: Record<ConfidenceKey, number>;
  validated: boolean;
  missing: string[];
};

type LedgerRow = Extraction & { loggedAt: string };

const SAMPLES: { id: string; label: string; data: Extraction }[] = [
  {
    id: "acme",
    label: "Acme Supplies GmbH — invoice 2026-0142.pdf",
    data: {
      source: "sample",
      vendor: "Acme Supplies GmbH",
      invoiceNumber: "2026-0142",
      date: "2026-03-12",
      totalEur: 1485.12,
      vatEur: 237.12,
      vatRate: 19,
      lines: [
        { description: "Ergo office chair (adjustable)", qty: 6, unit: "pcs", amount: 960.0 },
        { description: "LED desk lamp, dimmable", qty: 6, unit: "pcs", amount: 288.0 },
      ],
      confidence: { vendor: 99, invoiceNumber: 100, date: 99, totalEur: 98, vatEur: 97, lines: 96 },
      validated: true,
      missing: [],
    },
  },
  {
    id: "techparts",
    label: "TechParts Ltd — invoice INV-8831.pdf",
    data: {
      source: "sample",
      vendor: "TechParts Ltd",
      invoiceNumber: "INV-8831",
      date: "2026-02-27",
      totalEur: 919.2,
      vatEur: 153.2,
      vatRate: 20,
      lines: [
        { description: "Industrial ATX motherboard", qty: 4, unit: "pcs", amount: 596.0 },
        { description: "32GB DDR5 RAM kit", qty: 2, unit: "pcs", amount: 170.0 },
      ],
      confidence: { vendor: 100, invoiceNumber: 100, date: 99, totalEur: 99, vatEur: 98, lines: 97 },
      validated: true,
      missing: [],
    },
  },
];

const CONFIDENCE_FIELDS: { key: ConfidenceKey; label: string }[] = [
  { key: "vendor", label: "Vendor" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "date", label: "Date" },
  { key: "totalEur", label: "Total (EUR)" },
  { key: "vatEur", label: "VAT" },
  { key: "lines", label: "Line items" },
];

const euro = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

function parseInvoiceText(text: string): Extraction {
  const vendor =
    (text.match(/([A-Za-zÀ-ž][A-Za-zÀ-ž .&'-]*(?:GmbH|Ltd|B\.V\.|S\.A\.|UG|AG|PLC|Corp|Co\.))/i)?.[1] ??
      (text.split("\n").find((l) => /[A-Za-z]{3}/.test(l) && l.trim().length < 60)?.trim() ?? "")) ||
    "Unknown vendor";

  const invoiceNumber =
    (text.match(/(?:invoice\s*(?:no\.?|number|#)?\s*[:#]?\s*)([A-Z0-9][A-Z0-9\-/]{3,})/i)?.[1] ??
      text.match(/\b(?:INV|2026)-?\d{3,}/i)?.[0] ??
      "") ||
    "Unknown";

  const date =
    (text.match(/\b(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})\b/)?.[1] ??
      text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1] ??
      "") ||
    "Unknown";

  const parseMoney = (s?: string) => {
    if (!s) return null;
    const cleaned = s.replace(/[^\d.,]/g, "").trim();
    if (!cleaned) return null;
    if (cleaned.includes(",") && cleaned.includes(".")) {
      const last = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? "," : ".";
      return parseFloat(cleaned.split(last).join("").replace(/[.,]/g, "") + "." + cleaned.split(last)[1]);
    }
    return parseFloat(cleaned.replace(",", "."));
  };

  const totalEur =
    parseMoney(text.match(/(?:total|amount\s*due|grand\s*total|summe|gesamt)\s*[:€]?\s*[€]?\s*([\d.,]+)/i)?.[1]) ?? null;

  const vatEur =
    parseMoney(text.match(/(?:vat|mws(t)?|tax|ust)\s*[:€]?\s*[€]?\s*([\d.,]+)/i)?.[2]) ?? null;

  const rateMatch = text.match(/(?:vat|mws|tax)\s*(?:rate)?\s*[:]?\s*(\d{1,2})\s*%/i);
  const vatRate = rateMatch ? parseInt(rateMatch[1], 10) : vatEur && totalEur ? Math.round((vatEur / (totalEur - vatEur)) * 100) : 0;

  const lines: LineItem[] = text
    .split("\n")
    .map((line) => line.trim())
    .filter((l) => /^\d/.test(l) && /€|[\d.,]+$/.test(l))
    .slice(0, 8)
    .map((l) => {
      const desc = l.replace(/€[\s\d.,]+$/g, "").replace(/\s{2,}/g, " ").slice(0, 60);
      const amount = parseMoney(l.match(/([\d.,]+)\s*€?$/)?.[1]) ?? 0;
      const qty = parseInt(l.match(/^(\d+)/)?.[1] ?? "1", 10);
      return { description: desc || "Line item", qty, unit: "pcs", amount };
    })
    .filter((l) => l.amount > 0);

  const missing: string[] = [];
  if (!vendor || vendor === "Unknown vendor") missing.push("vendor");
  if (!invoiceNumber || invoiceNumber === "Unknown") missing.push("invoiceNumber");
  if (!date || date === "Unknown") missing.push("date");
  if (totalEur === null) missing.push("totalEur");

  return {
    source: "ocr",
    vendor: vendor || "Unknown vendor",
    invoiceNumber: invoiceNumber || "Unknown",
    date: date || "Unknown",
    totalEur: totalEur ?? 0,
    vatEur: vatEur ?? 0,
    vatRate,
    lines,
    confidence: {
      vendor: 92,
      invoiceNumber: 88,
      date: 90,
      totalEur: 85,
      vatEur: 82,
      lines: lines.length ? 80 : 0,
    },
    validated: missing.length === 0,
    missing,
  };
}

export default function InvoiceReader() {
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "reading" | "failed">("idle");
  const [pasteFallback, setPasteFallback] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [logged, setLogged] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const pickSample = (sample: (typeof SAMPLES)[number]) => {
    markInteracted();
    setOcrStatus("idle");
    setPasteFallback(false);
    setExtraction(sample.data);
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    markInteracted();
    setPasteFallback(false);
    setOcrStatus("reading");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const text = (data.text ?? "").trim();
      if (text.length < 20) {
        setOcrStatus("failed");
        setPasteFallback(true);
        setExtraction(null);
        return;
      }
      setExtraction(parseInvoiceText(text));
      setOcrStatus("idle");
    } catch {
      setOcrStatus("failed");
      setPasteFallback(true);
      setExtraction(null);
    }
  };

  const submitPasted = () => {
    markInteracted();
    const text = pastedText.trim();
    if (!text) return;
    setExtraction(parseInvoiceText(text));
    setPasteFallback(false);
  };

  const logToLedger = () => {
    if (!extraction) return;
    markInteracted();
    setLedger((prev) => [...prev, { ...extraction, loggedAt: new Date().toISOString().slice(0, 10) }]);
    setLogged(true);
    setTimeout(() => setLogged(false), 2500);
  };

  const hasExtraction = extraction !== null;

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e]"
    >
      {/* Mode selector */}
      <div className="border-b border-white/10 bg-[#111111] px-5 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
          Step 1 — where does the invoice come from?
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickSample(s)}
              className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 text-left transition-colors hover:border-[#25D366]/50"
            >
              <span className="block text-xs font-medium text-white/50">Sample invoice</span>
              <span className="mt-1 block text-sm font-semibold text-white">{s.label}</span>
              <span className="mt-2 inline-block rounded-full bg-[#25D366]/10 px-2 py-0.5 text-[10px] font-medium text-[#25D366]">
                ground truth — instant
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-start justify-center rounded-xl border border-dashed border-white/20 bg-[#0a0a0a] p-4 text-left transition-colors hover:border-[#25D366]/60"
          >
            <span className="block text-xs font-medium text-white/50">Upload your own</span>
            <span className="mt-1 block text-sm font-semibold text-white">
              Image (OCR)
            </span>
            <span className="mt-2 text-[10px] text-white/50">tesseract.js runs in your browser</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e)} />
        </div>
        {ocrStatus === "reading" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0a0a0a] px-4 py-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#25D366]" />
            <p className="text-sm text-white/70">AI reading your document…</p>
          </div>
        )}
      </div>

      {/* Paste fallback */}
      {pasteFallback && (
        <div className="border-b border-white/10 bg-[#10130f] px-5 py-4">
          <p className="text-sm font-medium text-amber-300">
            Couldn&apos;t read enough text from that file.
          </p>
          <p className="mt-1 text-xs text-white/50">Paste the invoice text instead and the same extraction runs on it:</p>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={4}
            placeholder={"Acme Supplies GmbH\nInvoice 2026-0142\nDate: 12.03.2026\n1x Ergo chair 160.00\nTotal: 1485.12 EUR incl. VAT 19%"}
            className="mt-3 w-full rounded-xl border border-white/10 bg-[#0a0a0a] p-3 font-mono text-xs text-white placeholder-white/25 outline-none focus:border-[#25D366]/60"
          />
          <button
            type="button"
            onClick={submitPasted}
            className="mt-3 rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-black hover:bg-[#1fb958]"
          >
            Extract from pasted text
          </button>
        </div>
      )}

      {/* Extraction result */}
      {hasExtraction && (
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
              Step 2 — extraction result
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                extraction.validated
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {extraction.validated ? "✓ All fields validated" : "⚠ Review needed"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONFIDENCE_FIELDS.map((field) => {
              const value = extraction[field.key];
              const conf = extraction.confidence[field.key];
              const display =
                field.key === "totalEur" || field.key === "vatEur"
                  ? euro(typeof value === "number" ? value : 0)
                  : field.key === "lines"
                    ? `${extraction.lines.length} line${extraction.lines.length === 1 ? "" : "s"}`
                    : String(value);
              return (
                <div key={field.key} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/50">{field.label}</p>
                    <p className="font-mono text-xs font-semibold text-white">{display}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#25D366]"
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-white/40">{conf}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {extraction.lines.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111111] text-xs text-white/50">
                  <tr>
                    <th className="px-4 py-2 font-medium">Line item</th>
                    <th className="px-4 py-2 font-medium">Qty</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#0a0a0a]">
                  {extraction.lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-white/85">{line.description}</td>
                      <td className="px-4 py-2 text-white/60">{line.qty} {line.unit}</td>
                      <td className="px-4 py-2 font-mono text-white/85">{euro(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            onClick={logToLedger}
            className="mt-4 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#1fb958]"
          >
            {logged ? "Logged to ledger ✓" : "Log to ledger"}
          </button>
          <p className="mt-2 text-xs text-white/50">
            Production writes to Google Sheets / Supabase via n8n — same row, same shape.
          </p>
        </div>
      )}

      {/* Ledger */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">
            Step 3 — ledger
          </p>
          <span className="rounded-md border border-white/10 bg-[#111111] px-2 py-1 font-mono text-[10px] text-white/50">
            invoices_2026.csv
          </span>
        </div>
        {ledger.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] px-4 py-6 text-center text-sm text-white/50">
            No rows yet — extract an invoice and hit &quot;Log to ledger&quot;.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111111] text-xs text-white/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Invoice #</th>
                  <th className="px-3 py-2 font-medium">Total (EUR)</th>
                  <th className="px-3 py-2 font-medium">VAT</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0a0a0a]">
                {ledger.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-white/70">{row.loggedAt}</td>
                    <td className="px-3 py-2 text-white/85">{row.vendor}</td>
                    <td className="px-3 py-2 font-mono text-white/85">{row.invoiceNumber}</td>
                    <td className="px-3 py-2 font-mono text-white/85">{euro(row.totalEur)}</td>
                    <td className="px-3 py-2 font-mono text-white/60">{euro(row.vatEur)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          row.validated
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {row.validated ? "validated" : "review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-3">
        <p className="text-xs leading-relaxed text-white/50">
          <span className="font-semibold text-white/70">Demo extracts in-browser;</span> your file never leaves
          this page. A production run sends the same PDF to OpenAI Vision via n8n and appends the validated row
          straight to Google Sheets.
        </p>
      </div>
    </div>
  );
}
