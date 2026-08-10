# Spec: Portfolio-Repo-Spec

Scope: repo

# Automation Portfolio - Repo Spec (repo scope)

Client-ready portfolio site for a Dhaka-based SMB automation collective selling custom n8n + AI automation across WhatsApp, web, email and phone to SMBs in Bangladesh and Europe. Solo dev initially; collective grows later.

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS, ESLint. Node 24, npm.
- Static-friendly: all demos client-side; no backend/db in v1.
- Hosting: Vercel or Cloudflare Pages (free). Analytics: lightweight custom event hooks via data attributes (e.g., `data-demo-interacted`, `data-json-downloaded`) - wired to console/metrics stub in v1, real analytics deferred.
- Git repo initialized at scaffold.

## Site structure
- `/` - Home: hero (outcome-first tagline, who we help, proof strip), services (10 lines, channel-neutral: omni-channel order/lead capture, AI document processing, lightning lead response, booking + no-show recovery, voice AI receptionist, reporting + ops automation, AI support triage and ticketing, prospect list building and AI outbound, review management and reputation, e-commerce ops sync - priced per-workflow menu, no public pricing), demos grid (6 live demos), case studies placeholder (2 slots), CTA strip (free automation audit call), footer (contact: WhatsApp + email, Dhaka → remote EU).
- `/demos` + `/demos/[slug]` - live interactive demos (6): whatsapp-order-bot, ai-invoice-reader, lightning-lead-response, meeting-minutes-bot, spreadsheet-rescue, email-triage.
- `/services` - service detail pages or single page with anchors.
- `/contact` - audit booking form: name, business, pain, WhatsApp/email; v1 = mailto fallback or Formspree placeholder.
- `public/downloads/` - 6 n8n workflow JSONs + README per demo, downloadable as lead magnets.

## Demos (v2, six total)
1. **WhatsApp Order Bot (BD)** - mock WhatsApp chat UI: customer picks product → size/address → bKash payment instruction → txn ID → verified → order confirmed + delivery update. Bangla+English bilingual flavor. Metric: "manual order handling 15 min → 2 min". Real n8n JSON download.
2. **AI Invoice Reader (EU)** - upload PDF/image (tesseract.js client-side, disclaimer) or pick 2-3 sample invoices (ground truth) → extract vendor/amount/VAT/line items → validation + ledger log view. Metric: "4 hrs → 15 min/week". n8n JSON download.
3. **Lightning Lead Response** - enter a fake lead message → AI score + personalized reply draft + CRM entry + Slack alert timeline. Metric: "response 6 hrs → <5 min". n8n JSON download.
4. **Meeting Minutes Bot** - paste a transcript or pick a sample → simulated Whisper transcription → AI summary with decisions and owner-assigned action items → posted to Notion + Slack timeline. Metric: "2 hrs of notes → 5 min". n8n JSON download.
5. **Spreadsheet Rescue** - paste a messy CSV or pick a sample → simulated AI cleaning (schema suggestion, dedupe, standardization, validation) → clean rows table → export to CRM/Sheets view. Metric: "a week of cleanup → one upload". n8n JSON download.
6. **Email Triage** - simulated Gmail inbox (3 sample emails) → AI classifies (lead/invoice/spam), prioritizes, drafts a reply → human approves (HITL) → sends + logs to CRM timeline. Metric: "inbox zero without the stress". n8n JSON download.

## Blueprint spec-sheet library
Each of the 10 services has a blueprint spec sheet in `blueprints/specs/` (01 to 10), written so a blueprint agent can build and stress-test a production n8n workflow from the sheet alone. The 4 newest services (AI support triage and ticketing, prospect list building and AI outbound, review management and reputation, e-commerce ops sync) have spec sheets but NO demos built yet; their interactive demos are deferred.

## Copy guardrails
- Zero em dashes repo-wide; re-punctuate with periods, colons or restructured sentences.
- Channel-neutral language: WhatsApp is a flagship channel, not the brand identity; demos and services cover WhatsApp, web, email and phone.

## Design system
- Dark theme, modern automation-agency aesthetic; accent color for CTAs; outcome-first copy ("never miss a deal", "4 hrs → 15 min"); no public pricing; single primary CTA repeated (free audit call).
- Mobile-first responsive; Bangla text where BD-specific.
- Case-study format: client → problem → what we built (tool names) → result metric.

## Success metrics
Demo interaction rate, JSON downloads, audit-call bookings, first paid trial ($200) conversion.

## Deferred (Phase 2b+)
Real case studies (need 2-3 delivered projects), branding/domain, analytics, real form backend, voice agent demo, BD section in Bangla with bKash pricing in BDT, demos for the four newest services (AI support triage and ticketing, prospect list building and AI outbound, review management and reputation, e-commerce ops sync).