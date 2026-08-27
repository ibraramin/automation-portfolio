# 00-omni-chat-core: n8n Blueprint — Omni Chat Core (Unified)

> **Unified build (2026-08-27 pivot):** This is the **main build** subsuming 01–10. 04-booking-reminders is a superseded slice whose verify/outbound patterns are folded here. See `docs/specs/Omni-Unified-Spec.md` + `blueprints/sandbox/SETUP-GUIDE.md` §§4/4a/4b.

## 1. Header

| Field | Value |
|---|---|
| Service id | omni-chat-core |
| Blueprint | `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes, id `eeO8Jl1VeK2f2Z9d`) |
| Blueprint version | v0.1.13 |
| Date | 2026-08-27 |
| Author | NexusAutomations — n8n automation architect |
| Business | NexusAutomations |
| Tunnel (ephemeral) | `constitutes-cats-wheels-app.trycloudflare.com` (quick tunnel, verified E2E) |
| Tunnel (named, pending) | `nexusautomations-sandbox` → `nexusautomations.dev` (requires `cloudflared tunnel create nexusautomations-sandbox` + DNS route) |

## 2. Summary

One 71-node workflow compresses ten services (01 capture, 02 doc-processing, 03 lead-response, 04 bookings/reminders slice, 05 voice, 06 reporting, 07 support-triage, 08 outbound, 09 reviews, 10 ecommerce) into a single omni-channel chat core. Clients deploy **one workflow**, not eleven. Intake is WhatsApp / Messenger / Instagram / email / web-widget → normalize → dedupe → RAG/rules/LLM routing → six pluggable modules (Rules, RAG, Booking, Lead, Support, Handoff) → unified send + logging. Verify layer and outbound are parity-fixed (see §15.5). 11-automation-debugging stays a separate runbook.

## 3. Architecture overview (71 nodes)

```
t01 WhatsApp webhook ──> t01p Tag WhatsApp ──┐
t02 Messenger webhook ─> t02p Tag Messenger ─┤
t03 Instagram webhook ─> t03p Tag Instagram ─┤
t04 Email (disabled) ────────────────────────┤
t05 Web widget ──────────────────────────────┤
                                            v
                                  n00 Registry (client + modules)
                                            |
                                  n01 Normalize (from/messageId/text/button)
                                            |
                                  n02 Dedupe (wamid rolling 1k) ──> g01 unique? ──> n02x exit if duplicate
                                            |
                                  n01p Wrap module input ──> g05 Thread human free? (n28 lookup + n29 gate)
                                            |
                                  n14 Rules match? ──> g02 rules matched? ─┐
                                  n15 Embed ─> n16 RAG search ─> n17 RAG score ─> g03/g04 RAG threshold?
                                  n18 LLM classify ─> n19 Parse classify ────┤
                                            |                                 v
                                            └────────── n03 Route (switch) ─┬─ Rules ─> n20 Execute M1 Rules (E4OMq15MVN02rvMM)
                                                                            ├─ RAG ───> n21 Execute M2 RAG (ZJ6BeDNECT4bYFFC)
                                                                            ├─ Booking> n22 Execute M3 Booking (XIdIZ2lnp7ZZKQxW)
                                                                            ├─ Lead ──> n23 Execute M4 Lead (G95nOwNXvstqOFoP)
                                                                            ├─ Support> n24 Execute M5 Support (ayDgfI4zsTn80Erq)
                                                                            ├─ Handoff> n25 Execute M6 Handoff (bLSYgRzPGzwGju6i)
                                                                            └─ Guided -> n27 Guided prompt
                                                                            |
                                  n26 Merge module outputs ─> n26p Attach message ─> n05 Send reply (switch) ─> n06 WhatsApp / n07 Messenger / n08 Instagram / n09 Email / n10 Web
                                                                            |
                                                                          n12 Module failure fallback
                                            |
                                  n04p Prepare log rows ─> n04 Log conversation (Sheets) ─> n11 Persist state ─> n13 Alert (Slack)
                                            |
t01v/t02v/t03v (GET verify siblings) ──> g21 Meta token ok? ──> rw1 Respond challenge  [verify layer byte-identical, §15.5]
t06 Error trigger ──> n13 Alert
```

Supports sub-modules (8 workflows total, see REBUILD-RUNBOOK.md):

| # | Workflow | Id | Role |
|---|---|---|---|
| 1 | Omni M2 RAG Ingest | 51b8c8v2NK6WEd9S | Qdrant ingest (kb:services) |
| 2 | Omni M2 RAG Retrieval | ZJ6BeDNECT4bYFFC | Embed + Qdrant query, threshold 0.55 top_k 3 |
| 3 | Omni M1 Rules | E4OMq15MVN02rvMM | CSV rules engine (readWriteFile + extractFromFile + channel-filtered match) |
| 4 | Omni M3 Booking | XIdIZ2lnp7ZZKQxW | Calendar confirm + 24h/2h + recovery (04 slice patterns folded) |
| 5 | Omni M4 Lead Capture | G95nOwNXvstqOFoP | Lead capture + CRM |
| 6 | Omni M5 Support Triage | ayDgfI4zsTn80Erq | KB triage, handoff gate |
| 7 | Omni M6 Handoff | bLSYgRzPGzwGju6i | Human handoff |
| 8 | **Omni Chat Core** | **eeO8Jl1VeK2f2Z9d** | **71-node core (this blueprint)** |

## 4. Node inventory (71 nodes, canonical)

| Node id | Name | n8n type | v | Purpose |
|---|---|---|---|---|
| t01 | WhatsApp intake | webhook | 2.1 | POST `whatsapp-intake`, onReceived |
| t02 | Messenger intake | webhook | 2.1 | POST `messenger-intake` |
| t03 | Instagram intake | webhook | 2.1 | POST `instagram-intake` |
| t04 | Email intake | emailReadImap | 2.2 | Disabled placeholder, folder `{{CONFIG.email_intake_folder}}` |
| t05 | Web widget intake | webhook | 2.1 | POST `web-widget-intake` |
| t06 | Error trigger | errorTrigger | 1 | → Slack #alerts |
| t01p | Tag WhatsApp | code | 2 | channel=whatsapp |
| t02p | Tag Messenger | code | 2 | channel=messenger |
| t03p | Tag Instagram | code | 2 | channel=instagram |
| n00 | Registry | code | 2 | Client + modules registry (glamour-salon example, per-client `{{CONFIG.*}}` in prod) |
| n01 | Normalize | code | 2 | Canonical `from/messageId/text/button_reply.id/title`, dedupe key `wamid` |
| n02 | Dedupe | code | 2 | Rolling 1k `wamid` dedupe |
| n02x | Dedupe exit | noOp | 1 | Terminal duplicate |
| n01p | Wrap module input | code | 2 | `{message, context:{client_config}}` |
| n14 | Rules match | code | 2 | Channel-filtered CSV match (M1) |
| n15 | Embed message | httpRequest | 4.5 | POST `freellmapi:3001/v1/embeddings` |
| n16 | RAG search | httpRequest | 4.5 | POST `qdrant:6333/collections/{{kb}}/points/query` |
| n17 | RAG score | code | 2 | Threshold gate 0.55 |
| n18 | LLM classify | httpRequest | 4.5 | POST `freellmapi:3001/v1/chat/completions` |
| n19 | Parse classify | code | 2 | Intent → route |
| n03 | Route | switch | 3 | Route to M1/M2/M3/M4/M5/M6/guided |
| n20 | Execute M1 Rules | executeWorkflow | 1.3 | `E4OMq15MVN02rvMM` |
| n21 | Execute M2 RAG | executeWorkflow | 1.3 | `ZJ6BeDNECT4bYFFC` |
| n22 | Execute M3 Booking | executeWorkflow | 1.3 | `XIdIZ2lnp7ZZKQxW` (04 slice folded) |
| n23 | Execute M4 Lead | executeWorkflow | 1.3 | `G95nOwNXvstqOFoP` |
| n24 | Execute M5 Support | executeWorkflow | 1.3 | `ayDgfI4zsTn80Erq` |
| n25 | Execute M6 Handoff | executeWorkflow | 1.3 | `bLSYgRzPGzwGju6i` |
| n27 | Guided prompt | code | 2 | Fallback `What can I help...` |
| n26 | Merge module outputs | merge | 2 | Join module results |
| n26p | Attach message | code | 2 | `{reply:{text}}` |
| n05 | Send reply | switch | 3 | Channel switch to senders |
| n06 | **Send WhatsApp** | **httpRequest** | **4.5** | **POST `https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages` Bearer `{{CONFIG.whatsapp_token}}` — see §15.5** |
| n07 | Send Messenger | httpRequest | 4.5 | Graph `me/messages` |
| n08 | Send Instagram | httpRequest | 4.5 | Graph `me/messages` |
| n09 | Send email | emailSend | 2.1 | SMTP |
| n10 | Send web | httpRequest | 4.5 | `host.docker.internal:8899/reply` |
| n12 | Module failure fallback | code | 2 | Error → guided |
| n04p | Prepare log rows | code | 2 | Sheets rows |
| n04 | Log conversation | googleSheets | 4.7 | `glamour_conversations` |
| n11 | Persist state | googleSheets | 4.7 | Thread state |
| n13 | Alert | slack | 2.6 | `#alerts` |
| n28 | Lookup thread state | googleSheets | 4.7 | Human ownership |
| n29 | Human ownership gate | code | 2 | Human-free check |
| n30 | Human owned exit | noOp | 1 | Terminal human-owned |
| n31 | Read rules CSV | readWriteFile | 1.1 | M1 rules file |
| n32 | Extract rules CSV | extractFromFile | 1.1 | CSV parse |
| d20–d25 | Dispatch M1–M6 | code | 2 | Per-module dispatch wrappers |
| n33 | Resolve fallback | code | 2 | Fallback resolver |
| g01 | Dedupe unique? | if | 2.2 | dedupe gate |
| g02 | Rules matched? | if | 2.2 | rules hit |
| g03 | RAG enabled? | if | 2.2 | module enabled |
| g04 | RAG above threshold? | if | 2.2 | score ≥0.55 |
| g05 | Thread human free? | if | 2.2 | human not owned |
| g10–g15 | M1–M6 enabled? | if | 2.2 | module gates |
| g16 | Embed ok? | if | 2.2 | embed success |
| g17 | Fallback handoff? | if | 2.2 | fallback check |
| t01v | WhatsApp verify | webhook | 2.1 | GET `whatsapp-intake`, responseNode |
| t02v | Messenger verify | webhook | 2.1 | GET `messenger-intake` |
| t03v | Instagram verify | webhook | 2.1 | GET `instagram-intake` |
| g21 | Meta token ok? | if | 2.2 | `query["hub.verify_token"]` bracket + `hub.challenge` |
| rw1 | Respond challenge | respondToWebhook | 1.1 | echo `hub.challenge` |

All webhook triggers use `responseMode onReceived` for intake (async) and `responseNode` for verify siblings (GET challenge).

## 5. Per-client config block

One `Registry` block + `{{CONFIG.*}}` tokens:

- WhatsApp: `whatsapp_phone_number_id` (unquoted), `whatsapp_token`, `whatsapp_api_version`, `meta_verify_token` (see §15.5 + `config-template.json`)
- Product/catalog, bKash/LC channel, Sheets/Calendar/Slack creds+ids, courier/store creds, DeepSeek/freellmapi key/model, voice/Whisper, business hours, handoff numbers, thresholds
- Sheets per-client prefix (`glamour_conversations`/`_leads`/`_bookings`)

Filling `{{CONFIG.*}}` is the only per-client step; no core-logic edit without version bump + stress re-run.

## 6. Channel & stage routing

Code-normalized intake (`from`, `messageId`, `text`, `button_reply.id/title`), channel tags (t01p/t02p/t03p), switch stage router, human-handoff keywords, dedupe on `wamid` rolling 1k, thread human-free gate (n28/n29/g05).

## 7. RAG & rules

- **RAG `[kb:services]`:** `bridal` → services KB via Qdrant `glamour_kb` (M2). Embed → search → score ≥0.55 → answer; else fallback.
- **Rules M1:** CSV `glamour_rules.csv` via readWriteFile → extractFromFile → channel-filtered priority match (n14). Channel `all` matches every channel.
- **Guided fallback:** Generic `hi` steered via n14 channel filtering to guided prompt (n27 `What can I help...`). `hi → guided` is PASS; M1 rules CSV greeting not required (see `SETUP-GUIDE.md §4b`). Template sends use approved WhatsApp templates; plain-text fallback only within 24h window.

## 8. Booking / reminders (04 slice folded)

M3 Booking (`XIdIZ2lnp7ZZKQxW`) carries 04 patterns: calendar confirm + 24h/2h templates + recovery rebook, `phoneNumberId` unquoted, `httpRequest` outbound lesson #10, `pending_offer` alt/res, Sheets dedupe/availability re-check. Do not build 04 standalone — build M3 via 00.

## 9. Persistence

Google Sheets per-client prefix, Sheets + Calendar + Slack/Qdrant/freellmapi nodes. DeepSeek default (`deepseek-chat`/`deepseek-reasoner`, swappable), Whisper for audio (05).

## 10. Ops & failure modes

Error Trigger → Slack `#alerts`; retry with backoff; idempotency on `wamid`; per-client config isolation; webhook timeout 200+async; invalid payload dead-letter+Slack; Sheets 429 backoff→pending; courier 5xx→manual queue; token 401 pause+alert. Business-initiated outside 24h must be template (200+wamid is not delivery proof — see BUGS-AND-QUIRKS.md #8).

## 11. Cost model

n8n VPS $3–6 + DeepSeek $0–2 + WhatsApp $3–15 + Sheets $0 ≈ **$6–23/mo** for 300–500 conversations (store/courier separate). Verify WhatsApp pricing before quoting.

## 12. Stress & E2E

- **Tunnel handshake:** 3× correct verify PASS, 3× wrong-token empty PASS (`constitutes-cats-wheels-app.trycloudflare.com`; pending named `nexusautomations-sandbox`).
- **E2E:** `hi → What can I help...` (guided fallback) PASS; `bridal → RAG [kb:services]` PASS (~10s). No `hi → M1 rules CSV` requirement.
- **Stress matrix:** happy path, 10× volume (100 POSTs/5 min p95 <20s), malformed/empty, duplicate `wamid`, outage, quota 429, concurrent — from 01–10 §11, now run against 00.

## 13. Failure modes (quick ref)

Webhook timeout → 200+async; duplicate `wamid` silent exit; template outside 24h → must be template; Sheets 429 → backoff; courier 5xx → queue; token 401 → pause+alert.

## 14. Open questions

1. Sheet measures 30m after start vs after end — blueprint uses `no_show_grace_minutes`=30 after `start_at`.
2. Reschedule UX is quick-reply slots, no free-text reschedule.
3. Price stored but unused (no payment v0.1).
4. Owner alert swappable Slack↔WhatsApp template via `slack_enabled` gate.

## 15. Parity notes & outbound detail

### 15.5 Outbound WhatsApp — httpRequest 4.5, Bearer, unquoted phone_number_id

**Reference:** `blueprints/sandbox/SETUP-GUIDE.md §§4/4a/4b` + `blueprints/BUGS-AND-QUIRKS.md #10` (send_fix).

Live `send_fix` converted `n06 Send WhatsApp` from legacy `whatsApp 1.1` (`phoneNumberId: "{{CONFIG.whatsapp_phone_number_id}}"` + credential `whatsAppApi` + quoted `"{{CONFIG.whatsapp_phone_number_id}}"`) to **httpRequest Bearer**.

- **Do NOT re-introduce `whatsApp 1.1` for outbound.** Any future `00-omni-chat-core` re-import MUST use `httpRequest` 4.5.
- **Parity after fix (n06):**

  ```
  type: n8n-nodes-base.httpRequest
  typeVersion: 4.5
  method: POST
  url: https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages
       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       unquoted — never "{{CONFIG.whatsapp_phone_number_id}}" with quotes in URL or JSON body
  headers: Authorization: =Bearer {{CONFIG.whatsapp_token}}
  body: {{ JSON.stringify({ messaging_product: 'whatsapp', to: $json.message.sender.phone, type: 'text', text: { body: $json.reply.text } }) }}
               or template { type:'template' } inside 24h window
  credentials: none for this node — {{CONFIG.whatsapp_token}} is Bearer token (see sandbox/meta-credentials.env + config-template.json)
  ```

- **Quoted phone ID fix:** live `phone_number_id` previously rendered as quoted string (`"{{CONFIG.whatsapp_phone_number_id}}"`) — fixed to **unquoted** `{{CONFIG.whatsapp_phone_number_id}}` in URL path and JSON body. Credential `whatsAppApi` is **not used** for outbound.
- **Verify layer is byte-identical** (GET challenge siblings `t01v/t02v/t03v` + `g21 Meta token ok?` + `rw1` echo). `g21` uses bracket notation:

  ```
  leftValue:  ={{ $json.query["hub.verify_token"] }}   // bracket, not dot
  rightValue: ={{CONFIG.meta_verify_token}}             // placeholder from config-template.json
  leftValue2: ={{ $json.query["hub.challenge"] }} notEmpty
  combinator: and → true → rw1 respondWith text ={{ $json.query["hub.challenge"] }}
  ```

  Three correct challenges return the token; three wrong-token return empty — verified on quick-tunnel `constitutes-cats-wheels-app.trycloudflare.com`.
- **Inbound vs outbound divergence is intentional:** inbound verify stays `webhook` GET+`respondToWebhook`; outbound is intentionally `httpRequest`. This divergence from pre-fix Blueprint §15.5 / REBUILD-RUNBOOK n05 `whatsapp_credential` is intentional and must be kept to avoid 500 on import (missing `whatsAppApi` credential).
- **Other sends:** `n07 Send Messenger` / `n08 Send Instagram` already use `httpRequest` 4.5 with `=Bearer {{CONFIG.whatsapp_token}}` — same pattern, keep.

## 16. Version history

| Version | Date | Change |
|---|---|---|
| v0.1.13 | 2026-08-27 | **Current.** Parity fixes 79d396d landed + re-persist: `n06` httpRequest 4.5 (not whatsApp 1.1), unquoted `phone_number_id`, `{{CONFIG.meta_verify_token}}` placeholder (was hardcoded `vozYZZ...`), bracket `query["hub.verify_token"]`, `hi→guided` fallback (not M1 CSV) — quick-tunnel verified `constitutes-cats-wheels-app.trycloudflare.com`. 71 nodes `eeO8Jl1VeK2f2Z9d`. |
| v0.1.12 | 2026-08-27 | Unified pivot: 00 declared main build subsuming 01–10, 04 slice superseded patterns folded, 11 retained separate. Spec `Omni-Unified-Spec` created, banners prepended to Portfolio specs/plan, README/BUGS updated. |
| v0.1.11 | 2026-08-26 | Live E2E: `hi→guided` + `bridal→RAG [kb:services]` PASS (~10s) on quick tunnel; verify 3+3 PASS. |
| v0.1 | 2026-08-11 | Initial 04 slice v0.1 patterns: verify siblings, 24h/2h reminders, recovery, httpRequest lesson #4/#10 baseline. |

## 17. References

- `docs/specs/Omni-Unified-Spec.md` — single source of truth (unified build)
- `blueprints/sandbox/SETUP-GUIDE.md` §§4/4a/4b — tunnel + outbound parity + hi→guided correction
- `blueprints/BUGS-AND-QUIRKS.md` #10 — httpRequest parity (whatsApp 1.1 → httpRequest 4.5)
- `blueprints/sandbox/REBUILD-RUNBOOK.md` — 8-workflow import order + parity checklist + verify byte-identical
- `blueprints/sandbox/import-manifest.json` — `golive_prep_2026_08_25`, `eeO8Jl1VeK2f2Z9d`
- `blueprints/sandbox/config-template.json` — `{{CONFIG.meta_verify_token}}` placeholder
- `blueprints/builds/04-booking-reminders-prototype.json` — canonical slice reference (04 superseded)
- `public/downloads/*.json` — lead-magnet skeletons; 00 extends them
