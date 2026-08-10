# Portfolio Feature Spec — Nexus Automations

**Scope:** feature · **Status:** implemented v1 (Aug 2026) · **Repo:** /home/ibrar/Businesss/Ideas2
**Stack:** Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript · Tailwind CSS v4 · tesseract.js ^7 (client-side OCR, lazy-loaded)

## 1. Business goal

Convert visitors (non-technical SMB owners in Bangladesh and Europe) into **"free automation audit"** bookings. The site sells outcomes, not tools: no public pricing, one repeated CTA, live interactive demos as proof.

## 2. Design system

| Token | Value |
|---|---|
| Background | `#0a0a0a` |
| Surface | `#111113` |
| Ink (primary text) | `#f4f4f5` |
| Muted | `#a1a1aa` |
| Accent (WhatsApp green) | `#25d366` |
| Secondary (EU-facing) | `#38bdf8` |
| Borders | `white/10` |
| Fonts | Geist + Geist Mono (`next/font/google`) |

- Tailwind v4 `@theme inline` + `@theme` tokens in `app/globals.css`; `.bg-grid` blueprint utility; `prefers-reduced-motion` kill switch; `scroll-behavior: smooth` in CSS (no HTML attribute needed).
- Contrast floor: informational text ≥ `white/50` (4.5:1 on dark), placeholders ≥ `white/40`.

## 3. Brand + contact (single source of truth)

`components/site/config.ts` exports `SITE` — rename brand and update contact in ONE place:
- `name`: "Nexus Automations" (placeholder — rename before domain purchase)
- `whatsappUrl`: `https://wa.me/8801333095960`
- `email`: `ibrarshafin2002@gmail.com`
- `cta`: "Free automation audit"

## 4. Pages

| Route | Contents |
|---|---|
| `/` | Header (sticky, mobile menu) → Hero (outcome copy, stats: 10+ hrs saved / <5 min reply / 1–2 wks build) → ProofStrip (GMT+6, Payoneer, EU-hosted GDPR, n8n+AI) → ServicesGrid (6 services, outcome language, no pricing) → DemosGrid (live `DEMOS` from `lib/demos.ts`, graceful empty fallback) → ProcessSection (audit → quote → build → handover) → CTASection → Footer |
| `/services` | 6 detailed service blocks (pain / what we build / tech / who it's for) |
| `/demos` | Demo index: cards with title, tagline, market badges, metric callout, "Run the demo →" |
| `/demos/[slug]` | Async params (`PageProps<"/demos/[slug]">`, `await props.params`), `generateStaticParams`, `generateMetadata`, tech chips, "How it works", free n8n JSON download (`data-json-downloaded`), CTA |
| `/contact` | Audit form (name, business, contact, "which tasks eat your week") via mailto with honest success state; WhatsApp + email methods |

## 5. Interactive demos (conversion core)

All demos: `data-demo-interacted` attribute, "SIMULATION"-style honesty badges, "What's real here" production notes, restart flows, race-safe timers (runRef pattern, async setState in effects).

1. **WhatsApp Order Bot** (`components/demos/WhatsAppOrderBot.tsx`) — mock chat: bilingual greeting (Bangla+English, `lang="bn"` on Bangla), product chips (Cotton Kurti ৳899 / Denim Jacket ৳1,499 / Saree ৳2,200), size, address, bKash Send-Money instruction (01711-223344), TrxID entry → format check + **human-confirm note** (there is no public bKash API to verify personal TrxIDs — the n8n JSON names its node "placeholder"), courier tracking (Pathao). **BD wedge.**
2. **AI Invoice Reader** (`components/demos/InvoiceReader.tsx`) — sample invoices (Acme Supplies GmbH, TechParts Ltd) with instant ground-truth extraction; upload = **images only** (tesseract.js is image-only; `accept="image/*"`, PDFs → paste-text fallback, honest message); per-field confidence, validation chip, "Log to ledger" → `invoices_2026.csv` table. **EU wedge.**
3. **Lightning Lead Response** (`components/demos/LeadResponse.tsx`) — lead form → 5-step timeline (received → AI score + extracted signal chips → reply draft → saved to HubSpot → Slack alert). **Both markets.**

## 6. Lead magnet

Three downloadable n8n workflow JSONs (`public/downloads/`): `whatsapp-order-bot.json` (26 nodes), `ai-invoice-reader.json` (21), `lightning-lead-response.json` (19) — realistic node graphs with `connections`, honest placeholder names. Downloaded via `<a download data-json-downloaded>`.

## 7. Copy guardrails (enforced)

- No public pricing. "Without the Western agency overhead" (not "fraction of the price").
- No unsourced metrics: "book more, faster", "cut no-shows" — no "3x"/"half"/"3.2s".
- Outcome-first, jargon-free, WhatsApp/email-first contact.

## 8. Conversion funnel + deferred Phase 2

- **Funnel:** landing → demo interaction → JSON download → audit form → WhatsApp call.
- **Deferred:** OG/social image (`public/opengraph-image.png` 1200×630) + `twitter: summary_large_image`; analytics collector for `data-demo-interacted`/`data-json-downloaded`; self-host tesseract worker/core/lang assets (first-upload CDN fetch ~10–15MB is accepted for v1); voice AI receptionist demo; real case studies after first clients; domain + final brand.

## 9. Quality gates (all passing)

`npx eslint .` clean · `npx tsc --noEmit` clean · `npm run build` OK (10 routes, 3 SSG demo pages).
Council review (2 models, unanimous): REJECT on dead contact placeholders only → fixed with real number/email (8801333095960 / ibrarshafin2002@gmail.com) → re-review pending.
