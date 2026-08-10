"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
  lang?: string;
};

type Product = { name: string; price: string; priceNum: number };

type Stage =
  | "idle"
  | "size"
  | "address"
  | "payment"
  | "verifying"
  | "confirmed"
  | "shipped"
  | "outfordelivery";

const PRODUCTS: Product[] = [
  { name: "Cotton Kurti", price: "৳899", priceNum: 899 },
  { name: "Denim Jacket", price: "৳1,499", priceNum: 1499 },
  { name: "Saree", price: "৳2,200", priceNum: 2200 },
];

const SIZES = ["S", "M", "L", "XL"];
const BKASH_NUMBER = "01711-223344";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const nowTime = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function WhatsAppOrderBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [typing, setTyping] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [chips, setChips] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [address, setAddress] = useState("");
  const [trxId, setTrxId] = useState("");
  const [trxError, setTrxError] = useState(false);
  const [orderNumber, setOrderNumber] = useState("SN-1042");
  const [copied, setCopied] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const idRef = useRef(0);
  const runRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const markInteracted = useCallback(() => setInteracted(true), []);

  const push = useCallback((from: ChatMessage["from"], text: string, lang?: string) => {
    const id = ++idRef.current;
    setMessages((prev) => [...prev, { id, from, text, time: nowTime(), lang }]);
  }, []);

  const botSay = useCallback(
    async (run: number, text: string, ms?: number) => {
      setTyping(true);
      await delay(ms ?? 600 + Math.random() * 600);
      if (runRef.current !== run) return;
      setTyping(false);
      push("bot", text);
    },
    [push]
  );

  const startFlow = useCallback(async () => {
    const run = ++runRef.current;
    setInteracted(true);
    setTyping(true);
    await delay(800);
    if (runRef.current !== run) return;
    setTyping(false);
    push("bot", "Welcome to ShopNest! Ki kinte chan? (What can I get you?) 😊", "bn");
    setChips(["Cotton Kurti ৳899", "Denim Jacket ৳1,499", "Saree ৳2,200"]);
  }, [push]);

  useEffect(() => {
    const t = setTimeout(startFlow, 50);
    return () => clearTimeout(t);
  }, [startFlow]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, verifying]);

  const handleProduct = async (label: string) => {
    markInteracted();
    const product = PRODUCTS.find((p) => `${p.name} ${p.price}` === label);
    if (!product) return;
    const run = ++runRef.current;
    setChips(null);
    push("user", label);
    setSelected(product);
    await botSay(run, `Great choice! 🛍️ ${product.name}, which size do you need?`);
    if (runRef.current !== run) return;
    setStage("size");
    setChips([...SIZES]);
  };

  const handleSize = async (size: string) => {
    markInteracted();
    const run = ++runRef.current;
    setChips(null);
    push("user", size);
    await botSay(run, "Perfect. 📍 Please send your delivery address (plus a contact number):");
    if (runRef.current !== run) return;
    setStage("address");
  };

  const submitAddress = async () => {
    const value = address.trim();
    if (!value) return;
    markInteracted();
    const run = ++runRef.current;
    push("user", value);
    setAddress("");
    await botSay(run, "Got it. Final step, payment via bKash 💚");
    if (runRef.current !== run) return;
    setStage("payment");
  };

  const submitTrxId = async () => {
    const value = trxId.trim();
    if (value.length < 10 || value.length > 12) {
      setTrxError(true);
      return;
    }
    markInteracted();
    const run = ++runRef.current;
    setTrxError(false);
    setChips(null);
    push("user", `TrxID: ${value}`);
    setTrxId("");
    setStage("verifying");
    setVerifying(true);
    await delay(1500);
    if (runRef.current !== run) return;
    setVerifying(false);
    setStage("confirmed");
    push("bot", `Payment confirmed ✓ Order ${orderNumber} placed.`);
    setChips(["Shipped", "Out for delivery"]);
  };

  const handleTracking = async (chip: string) => {
    markInteracted();
    const run = ++runRef.current;
    setChips(null);
    push("user", chip);
    if (chip === "Shipped") {
      await botSay(
        run,
        `📦 Order ${orderNumber} picked up by Pathao, tracking PATH-${orderNumber.replace("SN-", "")}. Expected delivery today, 6–9 PM.`,
        900
      );
      if (runRef.current !== run) return;
      setStage("shipped");
      setChips(["Out for delivery"]);
    } else {
      await botSay(
        run,
        "🛵 Your order is out for delivery! The rider is on the way, keep an eye on WhatsApp. Thank you for shopping with ShopNest! 💚",
        900
      );
      if (runRef.current !== run) return;
      setStage("outfordelivery");
    }
  };

  const copyNumber = async () => {
    markInteracted();
    try {
      await navigator.clipboard.writeText(BKASH_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, the number is already selectable text
    }
  };

  const restart = () => {
    runRef.current += 1;
    setMessages([]);
    setStage("idle");
    setChips(null);
    setTyping(false);
    setVerifying(false);
    setSelected(null);
    setAddress("");
    setTrxId("");
    setTrxError(false);
    setCopied(false);
    setInteracted(false);
    setOrderNumber(`SN-${Math.floor(1000 + Math.random() * 9000)}`);
    setTimeout(() => startFlow(), 200);
  };

  const isSimulating = stage !== "idle" || messages.length > 0;

  return (
    <div
      data-demo-interacted={interacted ? "true" : undefined}
      className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl shadow-black/50"
    >
      {/* Chat header */}
      <div className="flex items-center justify-between gap-3 border-b border-edge bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wa text-lg font-bold text-wa-ink">
            S
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">ShopNest</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-wa" /> online
            </p>
          </div>
        </div>
        <span className="rounded-full border border-wa/30 bg-wa/10 px-2.5 py-1 text-[10px] font-medium tracking-wide text-wa">
          SIMULATION, no real payment
        </span>
      </div>

      {/* Messages */}
      <div className="flex h-[420px] flex-col gap-2 overflow-y-auto bg-bg bg-[radial-gradient(circle_at_1px_1px,var(--grid-line)_1px,transparent_0)] bg-[size:22px_22px] p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex max-w-[80%] flex-col ${msg.from === "user" ? "self-end items-end" : "self-start items-start"}`}
          >
            <div
              className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                msg.from === "user"
                  ? "rounded-br-sm bg-wa text-wa-ink"
                  : "rounded-bl-sm border border-edge bg-surface-2 text-ink"
              }`}
              lang={msg.lang}
            >
              {msg.text}
            </div>
            <span className="mt-1 px-1 text-[10px] text-muted">{msg.time}</span>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-bl-sm border border-edge bg-surface-2 px-4 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted/40"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        {/* Verifying spinner */}
        {verifying && (
          <div className="flex max-w-[80%] flex-col self-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-edge bg-surface-2 px-4 py-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge-strong border-t-wa" />
              <span className="text-sm text-ink/90">Verifying payment with bKash…</span>
            </div>
            <span className="mt-1 px-1 text-[10px] text-muted">{nowTime()}</span>
          </div>
        )}

        {/* bKash payment card */}
        {stage === "payment" && (
          <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-wa/25 bg-wa/10 p-4">
            <p className="text-[10px] font-semibold tracking-widest text-wa uppercase">
              bKash payment instruction
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Send Money to{" "}
              <button
                type="button"
                onClick={copyNumber}
                className="font-mono font-semibold text-wa underline-offset-2 hover:underline"
              >
                {BKASH_NUMBER}
              </button>{" "}
              (ShopNest), amount{" "}
              <span className="font-semibold text-ink">
                {selected ? selected.price : "৳899"}
              </span>
              . Then send us your Transaction ID.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-edge bg-surface-soft-2 px-3 py-2">
              <span className="font-mono text-xs text-muted">{BKASH_NUMBER}</span>
              <button
                type="button"
                onClick={copyNumber}
                className="rounded-md bg-wa px-2 py-1 text-xs font-semibold text-wa-ink hover:bg-wa-strong"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Order confirmed card */}
        {stage === "confirmed" && (
          <div className="self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-edge bg-surface-2 p-4">
            <p className="text-[10px] font-semibold tracking-widest text-wa uppercase">
              Order confirmed
            </p>
            <p className="mt-2 text-sm text-ink">
              Order <span className="font-mono font-semibold text-ink">{orderNumber}</span>{" "}
              · {selected?.name} {selected?.price} · size {messages.filter((m) => SIZES.includes(m.text)).at(-1)?.text ?? "M"}
            </p>
            <p className="mt-1 text-xs text-muted">Courier: Pathao · ETA today, 6–9 PM</p>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick-reply chips */}
      {chips && (
        <div className="flex flex-wrap gap-2 border-t border-edge bg-surface-2 px-4 py-3">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                if (stage === "size") void handleSize(chip);
                else if (stage === "confirmed" || stage === "shipped") void handleTracking(chip);
                else void handleProduct(chip);
              }}
              className="rounded-full border border-wa/40 bg-wa/10 px-3.5 py-1.5 text-xs font-medium text-wa transition-colors hover:bg-wa/20"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-edge bg-surface-2 px-4 py-3">
        {stage === "address" && (
          <div className="flex gap-2">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitAddress();
              }}
              placeholder="e.g. 12 Market Street"
              className="flex-1 rounded-full border border-edge bg-surface-soft px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-wa/60"
            />
            <button
              type="button"
              onClick={() => void submitAddress()}
              className="rounded-full bg-wa px-5 py-2.5 text-sm font-semibold text-wa-ink hover:bg-wa-strong"
            >
              Send
            </button>
          </div>
        )}

        {stage === "payment" && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                value={trxId}
                onChange={(e) => {
                  setTrxId(e.target.value);
                  setTrxError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitTrxId();
                }}
                placeholder="Paste your bKash Transaction ID (10–12 digits)"
                className="flex-1 rounded-full border border-edge bg-surface-soft px-4 py-2.5 font-mono text-sm text-ink placeholder:text-muted/60 outline-none focus:border-wa/60"
              />
              <button
                type="button"
                onClick={() => void submitTrxId()}
                className="rounded-full bg-wa px-5 py-2.5 text-sm font-semibold text-wa-ink hover:bg-wa-strong"
              >
                Verify
              </button>
            </div>
            {trxError && (
              <p className="text-xs text-amber-400">
                TrxID must be 10–12 characters, try any fake ID like <span className="font-mono">8N7KD2QPL4</span>
              </p>
            )}
          </div>
        )}

        {isSimulating && stage !== "address" && stage !== "payment" && (
          <button
            type="button"
            onClick={restart}
            className="w-full rounded-full border border-edge px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-edge-strong hover:text-ink"
          >
            ↺ Restart simulation
          </button>
        )}
      </div>

      {/* What's real here */}
      <div className="border-t border-edge bg-surface-soft px-4 py-3">
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink/90">What&apos;s real here:</span> a production build uses the
          WhatsApp Cloud API + bKash merchant API with the exact same flow, product buttons, payment
          instruction, a human-confirmed TrxID check, sheet logging and Pathao dispatch. Everything above is simulated
          locally in your browser.
        </p>
      </div>
    </div>
  );
}
