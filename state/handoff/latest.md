# Handoff — Unified Omni-Core Phase 2 Quick Verified (2026-08-27)

> **Pivot note (2026-08-27):** `00-omni-chat-core` is now the **main build** — 71 nodes v0.1.13 `eeO8Jl1VeK2f2Z9d`, quick tunnel `constitutes-cats-wheels-app.trycloudflare.com` **still UP 6/6 PASS** (ephemeral), prod pending `nexusautomations-sandbox.nexusautomations.dev`. Specs `01`–`10` subsumed (04 superseded slice), `11` separate runbook. Source: `docs/specs/Omni-Unified-Spec.md` · Plan: `docs/plans/Omni-Unified.md`.

## Objective (unified)

One unified n8n blueprint (`00-omni-chat-core`, 71 nodes, `eeO8Jl1VeK2f2Z9d`, v0.1.13) compresses ten services into single omni-channel chat core. Phase: `go-live-prep-phase2-quick-verified` — quick tunnel handshake 6/6 PASS, 00 re-persist on disk APPROVED (ephemeral-pending), token checklist done, quick E2E intake PASS (full delivery deferred to named tunnel allowlist/tokens).

## Decisions

- **2026-08-27 pivot:** 00 main build, 01–10 subsumed, 04 slice superseded, 11 separate.
- **Tunnel:** `constitutes-cats-wheels-app` quick tunnel still UP 6/6 PASS 2026-08-27 (was expected to rotate, didn't); prod pending `nexusautomations-sandbox` → `nexusautomations.dev` (buy domain, then `cloudflared tunnel create nexusautomations-sandbox` + `route dns`).
- **71 nodes v0.1.13 re-persist:** live `docker exec n8n-sandbox n8n export:workflow --id=eeO8Jl1VeK2f2Z9d` → sanitized `blueprints/builds/00-omni-chat-core-prototype.json` (71, httpRequest 4.5 unquoted Bearer `{{CONFIG.whatsapp_token}}`, bracket `query["hub.verify_token"]` + `{{CONFIG.meta_verify_token}}`, `{{CONFIG.freellmapi_token}}` placeholder, dedupe `[]`) + `designs/00 §15.5` + `REBUILD-RUNBOOK.md` + `import-manifest.json golive_prep_2026_08_25` — @reviewer APPROVED rev-2, @requirements BLOCKED pending named tunnel git persist (expected).
- **Parity fixes 79d396d:** httpRequest vs whatsAppApi, unquoted phone, meta_verify_token, hi→guided, gitignore — plus fix-3 freellmapi/dedupe sanitization.
- **Token checklist + quick stress:** `TOKEN-CHECKLIST.md` 158 lines (Sheets/Slack/Page+IG you-blocked) + `STRESS-REPORT-quick-2026-08-27.md` 6/6 handshake, hi/bridal intake PASS, 10 concurrent p95 1.12s PARTIAL, full 100/5min + 429/outage DEFERRED to named tunnel.

## Blockers / Open Risks

- **Domain + named tunnel** — `nexusautomations.dev` not yet bought; `nexusautomations-sandbox` not created; WEBHOOK_URL commented; 00 git status `ephemeral-pending-re-persist` until tunnel.
- **Sheets OAuth** — per-client `clientname_*` + 06 reporting blocked until re-consent (checklist ready).
- **Page/IG tokens** — Messenger/IG branches untested until Page + IG tokens (checklist ready).
- **Full stress deferred** — 100 POSTs/5min, outbound delivery proof (`#131030` allowlist), Sheets/Slack asserts pending tokens/named tunnel.

## Next Actions (3 — after quick verify)

1. Buy `nexusautomations.dev` → `cloudflared tunnel create nexusautomations-sandbox` + `route dns nexusautomations-sandbox.nexusautomations.dev` + WEBHOOK_URL + `docker compose up -d` + `git add` 00×4 + commit active
2. Issue human tokens via `TOKEN-CHECKLIST.md` (Sheets OAuth/Slack xoxb/Page+IG) and verify branches — you-blocked
3. Full stress + E2E on named tunnel: handshake 3×/3×, hi→guided + bridal→RAG, 100 POSTs/5min p95<20s, dupe, outage, 429, concurrent → @reviewer + @requirements-reviewer → deploy-ready

## Artifacts (unified)

- `docs/specs/Omni-Unified-Spec.md` · `docs/plans/Omni-Unified.md`
- `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes v0.1.13, on disk APPROVED pending git persist)
- `blueprints/designs/00-omni-chat-core-blueprint.md §15.5` · `blueprints/sandbox/REBUILD-RUNBOOK.md` · `SETUP-GUIDE.md §§4/4a/4b` · `import-manifest.json` · `config-template.json` (+ freellmapi_token/page_token)
- `blueprints/sandbox/TOKEN-CHECKLIST.md` · `STRESS-REPORT-quick-2026-08-27.md` (quick 6/6 PASS)

## Uncommitted Files (as of handoff — to be committed now)

Tracked M: `blueprints/sandbox/SETUP-GUIDE.md`, `config-template.json`, `docs/activeContext.md`, `docs/specs/Omni-Unified-Spec.md` + updated `state/session-state.json`, `state/handoff/latest.md`.
Untracked ?? (to add): `blueprints/builds/00-omni-chat-core-prototype.json` (71), `04-booking-reminders-prototype.json` (110KB, retains slice), `blueprints/designs/00-omni-chat-core-blueprint.md`, `blueprints/sandbox/REBUILD-RUNBOOK.md`, `import-manifest.json`, `TOKEN-CHECKLIST.md`, `STRESS-REPORT-quick-2026-08-27.md`, `docker-compose.yml` (pending domain), plus `blueprints/docs/plans/sandbox-setup.md`, `04-error-workflow.json`, `bookings-sheet-template.csv`. Skipped: `.opencode/` (memory), `meta-credentials.env`/`config.local.json` (gitignored secrets).

## Session State Pointer

Read `state/session-state.json` + this handoff + `docs/activeContext.md` first on session start. Plan: `docs/plans/Omni-Unified.md`.

---
*Generated: 2026-08-27 EOL — phase2-quick-verified — quick 6/6 PASS, 00 on disk APPROVED pending named tunnel, token checklist done — 71 nodes v0.1.13 — b69874a → this commit*
