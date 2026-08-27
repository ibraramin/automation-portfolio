# Spec: Omni-Unified-Spec

Scope: feature

# Omni Unified Spec — 00-omni-chat-core (feature scope)

**Scope:** feature · **Status:** main build (2026-08-27 pivot) · **Repo:** /home/shafin/Opencode/Business/Ideas2
**Supersedes:** 01-10 as standalone builds · **Retained:** 11 as separate runbook · **Slice superseded:** 04-booking-reminders

> **Pivot note (2026-08-27):** `00-omni-chat-core` is now the **main build**. Specs `01`–`10` are subsumed into this unified blueprint for experience compression. `04-booking-reminders` was a superseded slice (its verify/outbound patterns folded into 00). `11-automation-debugging` remains a **separate debugging runbook — not subsumed**. This spec is the single source of truth for the unified build; 01–10 are retained for traceability.

## 1. Goal

One unified n8n blueprint (`00-omni-chat-core`, 71 nodes) that compresses ten service experiences into a single omni-channel chat core: capture, document processing, lead response, booking/reminders, voice, reporting, support triage, outbound, reviews, and ecommerce ops. Clients deploy one workflow, not eleven. Debugging (11) stays separate.

## 2. Unified build identity

| Field | Value |
|---|---|
| Service id | omni-chat-core |
| Blueprint | `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes, id `eeO8Jl1VeK2f2Z9d`) |
| Version | v0.1.13 (verify + httpRequest parity landed; quick-tunnel verified) |
| Tunnel | `constitutes-cats-wheels-app.trycloudflare.com` — `cloudflared quick tunnel` (ephemeral per session, verified E2E); prod path is named tunnel `sandbox` (`cloudflared tunnel create sandbox`) |
| Design doc | `blueprints/designs/00-omni-chat-core-blueprint.md` §15.5 (outbound) + version history |
| Rebuild | `blueprints/sandbox/REBUILD-RUNBOOK.md` (when restored) + `blueprints/sandbox/SETUP-GUIDE.md` §§4/4a/4b |
| Manifest | `blueprints/sandbox/import-manifest.json` (`golive_prep_2026_08_25`) |

## 3. What is subsumed (01–10 → 00)

All ten services below are **capabilities inside 00**, not separate workflows:

| # | Spec | Capability now inside 00 |
|---|---|---|
| 01 | omni-capture | WhatsApp/web/email/Messenger intake, stage router, order + lead capture |
| 02 | doc-processing | AI document extraction (vision/OCR), field validation, filing |
| 03 | lead-response | Scoring, reply drafting, CRM + Slack alert within 5 min |
| 04 | booking-reminders | Calendar confirm + 24h/2h templates + recovery rebook — **superseded slice** (patterns merged; do not build standalone) |
| 05 | voice-receptionist | Voice AI receptionist (Whisper + TTS) — highest difficulty, realtime audio |
| 06 | reporting-ops | Reporting, spreadsheet rescue, meeting minutes |
| 07 | support-triage | AI triage + ticketing with KB RAG, 60–70% auto-resolve |
| 08 | prospect-outbound | List building + AI outbound (deliverability-aware) |
| 09 | review-management | Review request + reply + reputation dashboard |
| 10 | ecommerce-ops | Shopify/Woo → WhatsApp status → courier (Pathao/Steadfast) → inventory sync |

**Not subsumed:**
- **11-automation-debugging** — audit/repair runbook for existing n8n/Zapier/Make stacks. Entry service that converts into 00 builds. Stays standalone; lessons accrue via `BUGS-AND-QUIRKS.md`.

## 4. Core architecture (71 nodes)

- **Triggers & intake:** WhatsApp webhook (POST `whatsapp-intake`), web-form webhook (`booking-form`), email IMAP, schedule triggers. All webhooks return `{"status":"received"}` immediately, async processing after.
- **Verify layer (byte-identical repo ↔ live):** GET challenge siblings `t01v/t02v/t03v` + `g21 Meta token ok?` using bracket notation `query["hub.verify_token"]` (not dot) + `rw1` echo `hub.challenge`. Verified x3 correct + x3 wrong-token empty. `{{CONFIG.meta_verify_token}}` placeholder (see `config-template.json`).
- **Outbound WhatsApp (httpRequest, not whatsApp node):** `n06 Send WhatsApp` is `httpRequest 4.5` `POST https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages` with `Authorization: Bearer {{CONFIG.whatsapp_token}}`. No `whatsApp 1.1` + `whatsAppApi` credential for sends. `phone_number_id` unquoted (`{{CONFIG.whatsapp_phone_number_id}}`, never `"{{CONFIG.whatsapp_phone_number_id}}"`). Verified vs live `send_fix` patch; see `SETUP-GUIDE.md §4a` + `BUGS-AND-QUIRKS.md #10`.
- **Channel & stage routing:** Code-normalized intake (`from`, `messageId`, `text`, `button_reply.id/title`), Switch stage router, human-handoff keywords, dedupe on `wamid` (rolling 1k).
- **RAG & rules:** RAG `[kb:services]` for `bridal` → services KB; guided fallback prompt for generic `hi` (n14 channel filtering). `hi → guided prompt` is PASS; M1 `rules CSV` greeting not required (see `SETUP-GUIDE.md §4b`). Template sends use approved WhatsApp templates (confirm/reminder/recovery/owner_notify).
- **Persistence:** Google Sheets per-client prefix (`clientname_orders`/`contacts`/`bookings`), Sheets + Calendar + Slack nodes, Pathao/Steadfast courier HTTP, DeepSeek default (`deepseek-chat`/`deepseek-reasoner`, swappable per-client), Whisper for audio.
- **Ops:** Error Trigger → Slack `#alerts`, retry with backoff, idempotency, per-client config block isolation (no core-logic change per client without version bump + stress re-run).

## 5. Per-client config block (unified)

All client values in one place: WhatsApp phone/token/`whatsapp_api_version`/`meta_verify_token`, product catalog, bKash/LC channel, Sheets/Calendar/Slack creds + ids, courier creds, store creds, DeepSeek key/model, voice/Whisper keys, business hours, handoff numbers, thresholds. Filling `{{CONFIG.*}}` is the only per-client step.

## 6. Cost model (unified)

n8n VPS $3–6 + DeepSeek $0–2 + WhatsApp $3–15 + Sheets $0 ≈ **$6–23/mo** for 300–500 conversations. Store + courier fees separate. Verify WhatsApp conversation pricing before quoting.

## 7. Failure modes

Webhook timeout → 200 + async; invalid payload → dead-letter + Slack; duplicate `wamid` → silent exit; template outside 24h window → must be template (plain text silently dropped, 200 with `wamid` is not delivery proof); Sheets 429 → backoff → pending sheet; courier 5xx → manual queue; token 401 → pause + alert.

## 8. Stress & E2E

- **Tunnel handshake:** 3x correct verify PASS, 3x wrong-token empty PASS (`constitutes-cats-wheels-app.trycloudflare.com`).
- **E2E:** `hi → What can I help...` (guided fallback) PASS; `bridal → RAG [kb:services]` PASS (~10s). No requirement for `hi → M1 rules CSV`.
- **Stress matrix:** happy path, 10x volume (100 POSTs/5 min, p95 <20s), malformed/empty inputs, duplicate `wamid`, simulated outage, quota 429, concurrent runs — all from 01–10 §11 matrices, now run against 00.

## 9. Version notes

- 04-booking-reminders v0.2 patterns (verify siblings, 24h/2h reminders, recovery, httpRequest outbound lesson #10) are the canonical slice now inside 00 — do not diverge.
- 11 stays at its own version line; its fixes are logged but never merged into 00 node graph.

## 10. References

- `blueprints/README.md` (spec → blueprint → stress → deliver; 00 is main)
- `blueprints/BUGS-AND-QUIRKS.md` #10 (httpRequest parity)
- `blueprints/sandbox/SETUP-GUIDE.md` §§4/4a/4b + `config-template.json` (`{{CONFIG.meta_verify_token}}`)
- `public/downloads/*.json` (lead-magnet skeletons; 00 extends them)
- Prior verification: 71-node graph, quick-tunnel E2E, bracket notation, Bearer DEMO redaction.