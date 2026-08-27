# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2026-08-27 — go-live-prep-phase2-quick-verified — 00 re-persist + quick stress 6/6 PASS

- **Unified pivot docs:** named tunnel `constitutes-cats-wheels-app` (ephemeral quick still UP 6/6 2026-08-27) → `nexusautomations-sandbox` pending `nexusautomations.dev` — `Omni-Unified-Spec.md:23`, `SETUP-GUIDE.md §4`, `docker-compose.yml WEBHOOK_URL`, `activeContext.md` updated
- **Re-persist 00:** `blueprints/builds/00-omni-chat-core-prototype.json` 71 nodes `eeO8Jl1VeK2f2Z9d` v0.1.13 (live export sanitized: n06 httpRequest 4.5 unquoted Bearer `{{CONFIG.whatsapp_token}}`, g21 bracket `query["hub.verify_token"]` + `{{CONFIG.meta_verify_token}}`, n15/n18 `{{CONFIG.freellmapi_token}}`, dedupe `[]`), `designs/00 §15.5`, `REBUILD-RUNBOOK.md`, `import-manifest.json golive_prep_2026_08_25` — @reviewer APPROVED rev-2, @requirements BLOCKED pending named tunnel (expected `ephemeral-pending-re-persist`)
- **Human tokens:** `blueprints/sandbox/TOKEN-CHECKLIST.md` 158 lines — Sheets OAuth / Slack xoxb / Page+IG you-blocked (parallelizable)
- **Quick stress:** `STRESS-REPORT-quick-2026-08-27.md` 6/6 handshake PASS (3× correct 123 / 3× wrong empty), hi/bridal intake PASS, 10 concurrent p95 1.12s PARTIAL — full 100/5min + 429/outage DEFERRED to named tunnel
- **State:** `state/session-state.json` → phase2-quick-verified, `state/handoff/latest.md` + `docs/activeContext.md` EOL

### 2026-08-27 — pivot unify around 00-omni-chat-core

- 00-omni-chat-core declared main build subsuming 01-10 (04 superseded slice), 11 retained separate — `Omni-Unified-Spec.md` single source of truth
- Parity fixes httpRequest 4.5 outbound vs whatsApp 1.1, meta_verify_token placeholder, unquoted phone, hi→guided, sandbox gitignore critical (79d396d)
