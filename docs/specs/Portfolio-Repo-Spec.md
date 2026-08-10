# Spec: Portfolio-Repo-Spec

Scope: repo

# Automation Portfolio — Repo Spec (repo scope)

Client-ready portfolio site for a Dhaka-based SMB automation collective selling custom n8n + AI + WhatsApp automation to SMBs in Bangladesh and Europe. Solo dev initially; collective grows later.

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS, ESLint. Node 24, npm.
- Static-friendly: all demos client-side; no backend/db in v1.
- Hosting: Vercel or Cloudflare Pages (free). Analytics: lightweight custom event hooks via data attributes (e.g., `data-demo-interacted`, `data-json-downloaded`) — wired to console/metrics stub in v1, real analytics deferred.
- Git repo initialized at scaffold.

## Site structure
- `/` — Home: hero (outcome-first tagline, who we help, proof strip), services (6 lines: WhatsApp order/lead bot, invoice/doc AI extraction, lead response, booking + reminders, CRM/email sync+triage, voice AI receptionist — priced per-workflow menu, no public pricing), demos grid (3 live demos), case studies placeholder (2 slots), CTA strip (free automation audit call), footer (contact: WhatsApp + email, Dhaka → remote EU).
- `/demos` + `/demos/[slug]` — live interactive demos (3): whatsapp-order-bot, ai-invoice-reader, lightning-lead-response.
- `/services` — service detail pages or single page with anchors.
- `/contact` — audit booking form: name, business, pain, WhatsApp/email; v1 = mailto fallback or Formspree placeholder.
- `public/downloads/` — 3 n8n workflow JSONs + README per demo, downloadable as lead magnets.

## Demos (v1)
1. **WhatsApp Order Bot (BD)** — mock WhatsApp chat UI: customer picks product → size/address → bKash payment instruction → txn ID → verified → order confirmed + delivery update. Bangla+English bilingual flavor. Metric: "manual order handling 15 min → 2 min". Real n8n JSON download.
2. **AI Invoice Reader (EU)** — upload PDF/image (tesseract.js client-side, disclaimer) or pick 2-3 sample invoices (ground truth) → extract vendor/amount/VAT/line items → validation + ledger log view. Metric: "4 hrs → 15 min/week". n8n JSON download.
3. **Lightning Lead Response** — enter a fake lead message → AI score + personalized reply draft + CRM entry + Slack alert timeline. Metric: "response 6 hrs → <5 min". n8n JSON download.

## Design system
- Dark theme, modern automation-agency aesthetic; accent color for CTAs; outcome-first copy ("never miss a deal", "4 hrs → 15 min"); no public pricing; single primary CTA repeated (free audit call).
- Mobile-first responsive; Bangla text where BD-specific.
- Case-study format: client → problem → what we built (tool names) → result metric.

## Success metrics
Demo interaction rate, JSON downloads, audit-call bookings, first paid trial ($200) conversion.

## Deferred (Phase 2b+)
Remaining 3-5 demos, real case studies (need 2-3 delivered projects), branding/domain, analytics, real form backend, voice agent demo, BD section in Bangla with bKash pricing in BDT.