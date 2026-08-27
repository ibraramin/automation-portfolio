> **Pivot note (2026-08-27): Unified omni-core (00) is now the main build — specs 01–10 subsumed, 04 is a slice superseded, 11 separate.** See `docs/specs/Omni-Unified-Spec.md` and `blueprints/README.md`. Original content retained below for traceability.

# Portfolio Feature Spec - Nexus Automations

**Scope:** feature · **Status:** implemented v3 (Aug 2026) · **Repo:** /home/ibrar/Businesss/Ideas2
**Stack:** Next.js 16.3 (App Router, Turbopack) · React 19.2 · TypeScript · Tailwind CSS v4 · tesseract.js ^7 (client-side OCR, lazy-loaded)

## 1. Business goal

Convert visitors (non-technical SMB owners in Bangladesh and Europe) into **"free automation audit"** bookings. The site sells outcomes, not tools: no public pricing, one repeated CTA, live interactive demos as proof. Positioning is channel-neutral: n8n + AI automation across WhatsApp, web, email and phone, with WhatsApp as a flagship demo rather than the brand identity.

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

`components/site/config.ts` exports `SITE` - rename brand and update contact in ONE place:
- `name`: "Nexus Automations" (placeholder - rename before domain purchase)
- `whatsappUrl`: `https://wa.me/8801333095960`
- `email`: `ibrarshafin2002@gmail.com`
- `cta`: "Free automation audit"

## 4. Pages

| Route | Contents |
|---|---|
| `/` | Header (sticky, mobile menu) → Hero (outcome copy, stats: 10+ hrs saved / <5 min reply / 1–2 wks build) → ProofStrip (GMT+6, Payoneer, EU-hosted GDPR, n8n+AI) → ServicesGrid (11 services, outcome language, no pricing) → DemosGrid (live `DEMOS` from `lib/demos.ts`, graceful empty fallback) → ProcessSection (audit → quote → build → handover) → CTASection → Footer |
| `/services` | 11 detailed service blocks (pain / what we build / tech / who it's for) |
| `/demos` | Demo index: cards with title, tagline, market badges, metric callout, "Run the demo →" |
| `/demos/[slug]` | Async params (`PageProps<"/demos/[slug]">`, `await props.params`), `generateStaticParams`, `generateMetadata`, tech chips, "How it works", free n8n JSON download (`data-json-downloaded`), CTA |
| `/contact` | Audit form (name, business, contact, "which tasks eat your week") via mailto with honest success state; WhatsApp + email methods |

## 5. Interactive demos (conversion core)

All demos: `data-demo-interacted` attribute, "SIMULATION"-style honesty badges, "What's real here" production notes, restart flows, race-safe timers (runRef pattern, async setState in effects).

1. **WhatsApp Order Bot** (`components/demos/WhatsAppOrderBot.tsx`) - mock chat: bilingual greeting (Bangla+English, `lang="bn"` on Bangla), product chips (Cotton Kurti ৳899 / Denim Jacket ৳1,499 / Saree ৳2,200), size, address, bKash Send-Money instruction (01711-223344), TrxID entry → format check + **human-confirm note** (there is no public bKash API to verify personal TrxIDs - the n8n JSON names its node "placeholder"), courier tracking (Pathao). **BD wedge.**
2. **AI Invoice Reader** (`components/demos/InvoiceReader.tsx`) - sample invoices (Acme Supplies GmbH, TechParts Ltd) with instant ground-truth extraction; upload = **images only** (tesseract.js is image-only; `accept="image/*"`, PDFs → paste-text fallback, honest message); per-field confidence, validation chip, "Log to ledger" → `invoices_2026.csv` table. **EU wedge.**
3. **Lightning Lead Response** (`components/demos/LeadResponse.tsx`) - lead form → 5-step timeline (received → AI score + extracted signal chips → reply draft → saved to HubSpot → Slack alert). **Both markets.**
4. **Meeting Minutes Bot** (`components/demos/MeetingMinutesBot.tsx`) - paste a transcript or pick a sample (Q3 launch sync / Client kickoff) → simulated Whisper transcription → AI extracts decisions and owner-assigned action items (regex + simulated step timeline) → Notion page + Slack #minutes post. Metric: "2 hrs of notes → 5 min".
5. **Spreadsheet Rescue** (`components/demos/SpreadsheetRescue.tsx`) - paste a messy CSV or use the embedded sample → simulated AI cleaning: schema suggestion, dedupe by email, date/amount standardization, validation warnings → clean rows table → "Export to CRM/Sheets" appends to a visible `customers_2026.csv` view. Metric: "A week of cleanup → one upload".
6. **Email Triage** (`components/demos/EmailTriage.tsx`) - simulated Gmail inbox (3 prefilled emails) → AI classifies (lead / invoice / spam), ranks priority, drafts a reply → HITL approval card (Approve and send / Hold) → sends, logs to HubSpot timeline, files invoice, trashes spam. Metric: "Inbox zero, minus the stress".

Blueprint spec sheets exist for 5 more services (AI support triage and ticketing, prospect list building and AI outbound, review management and reputation, e-commerce ops sync, automation debugging and optimization) in `blueprints/specs/` (07 to 11). Their interactive demos are NOT built yet and are deferred to Phase 2b.

## 6. Lead magnet

Six downloadable n8n workflow JSONs (`public/downloads/`): `whatsapp-order-bot.json` (26 nodes), `ai-invoice-reader.json` (21), `lightning-lead-response.json` (19), `meeting-minutes-bot.json` (16), `spreadsheet-rescue.json` (17), `email-triage.json` (22) - realistic node graphs with `connections`, honest placeholder names. Downloaded via `<a download data-json-downloaded>`.

## 7. Copy guardrails (enforced)

- No public pricing. "Without the Western agency overhead" (not "fraction of the price").
- No unsourced metrics: "book more, faster", "cut no-shows" - no "3x"/"half"/"3.2s".
- Outcome-first, jargon-free, WhatsApp/email-first contact.
- **Zero em dashes** in any copy or n8n JSON strings; re-punctuate with periods, colons or restructured sentences.
- **Channel-neutral language**: WhatsApp is a flagship channel, not the brand; services and demos cover WhatsApp, web, email and phone.

## 8. Conversion funnel + deferred Phase 2

- **Funnel:** landing → demo interaction → JSON download → audit form → WhatsApp call.
- **Deferred:** OG/social image (`public/opengraph-image.png` 1200×630) + `twitter: summary_large_image`; analytics collector for `data-demo-interacted`/`data-json-downloaded`; self-host tesseract worker/core/lang assets (first-upload CDN fetch ~10–15MB is accepted for v1); voice AI receptionist demo; demos for the five newest services (support triage, prospect outbound, review management, e-commerce ops, automation debugging); real case studies after first clients; domain + final brand.

## 9. Quality gates (all passing)

`npx eslint .` clean · `npx tsc --noEmit` clean · `npm run build` OK (10 routes, 6 SSG demo pages).
Council review (2 models, 2 rounds): round 1 REJECT → all findings fixed; round 2 REJECT on 3 findings → all resolved (brand leak in lead-magnet JSON fixed, contrast sweep to ≥ white/60 for informational text, numeric capability claims accepted as sanctioned capability statements - "under 5 seconds" reply, "10+ hours a week" saved, "under 5 minutes" build). Live contact: WhatsApp 8801333095960, email ibrarshafin2002@gmail.com. Pushed to github.com/ibraramin/automation-portfolio.
