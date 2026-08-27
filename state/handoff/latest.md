# Handoff — Unified Omni-Core Pivot (2026-08-27)

> **Pivot note (2026-08-27):** `00-omni-chat-core` is now the **main build** — 71 nodes v0.1.13, tunnel `constitutes-cats-wheels-app.trycloudflare.com` (ephemeral quick tunnel). Specs `01`–`10` are **subsumed** into this unified blueprint (experience compression); `04-booking-reminders` is a **superseded slice**; `11-automation-debugging` remains a **separate runbook**. Single source of truth: `docs/specs/Omni-Unified-Spec.md` · Plan: `docs/plans/Omni-Unified.md`. History preserved append-only.

## Objective (unified)

One unified n8n blueprint (`00-omni-chat-core`, 71 nodes, `eeO8Jl1VeK2f2Z9d`, v0.1.13) compresses ten service experiences (01 capture, 02 doc processing, 03 lead response, 04 booking/reminders superseded, 05 voice, 06 reporting, 07 support triage, 08 outbound, 09 reviews, 10 ecommerce) into a single omni-channel chat core. Clients deploy one workflow. Debugging (11) stays separate. Phase: `go-live-prep-phase1-verified` — WhatsApp E2E `hi → guided (What can I help…)` + `bridal → RAG [kb:services]` verified ~10s on quick tunnel; verify layer byte-identical repo↔live.

## Decisions

- **2026-08-27 pivot:** 00 is main build, 01–10 subsumed, 04 slice superseded, 11 separate. Banners prepended to `Portfolio-Feature-Spec`, `Portfolio-Repo-Spec`, `Automation-Portfolio` plan; `blueprints/README.md` re-anchored to 00.
- **Tunnel:** `constitutes-cats-wheels-app` is `cloudflared quick tunnel` ephemeral per session (verified E2E). Prod path is named tunnel `sandbox` (`cloudflared tunnel create sandbox`).
- **71 nodes v0.1.13:** verify siblings `t01v/t02v/t03v` + `g21` bracket `query[\"hub.verify_token\"]`, httpRequest 4.5 outbound `POST https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages` + `Bearer {{CONFIG.whatsapp_token}}` (no whatsAppApi credential), unquoted `phone_number_id`, `{{CONFIG.meta_verify_token}}` placeholder.
- **Parity fixes 79d396d:** closed CHANGES_REQUESTED — httpRequest vs whatsAppApi, meta_verify_token placeholder, hi→guided expectation, sandbox .gitignore critical; `BUGS-AND-QUIRKS.md #10` + `SETUP-GUIDE.md §4a/4b`.
- **History preserved:** 11 spec sheets + 6 demos + Next.js site retained for traceability; unified spec/plan are additive.

## Blockers / Open Risks

- **M3/M4 Sheets OAuth blocked** — per-client Sheets (`clientname_orders/contacts/bookings`) + reporting ops (06) cannot be E2E-verified; 429/backoff path untested live.
- **Tunnel ephemeral** — quick-tunnel URL rotates; named tunnel `sandbox` not yet created.
- **Page/IG tokens pending** — Messenger/IG intake branches untested until Page + Instagram tokens issued.
- **00 artifacts gap** — `REBUILD-RUNBOOK.md` / `import-manifest.json` (`golive_prep_2026_08_25`) need re-persist when ephemeral branch available.

## Next Actions (4 — convenience order)

1. Create named tunnel `sandbox` → swap ephemeral `constitutes-cats-wheels-app` URL, update `Omni-Unified-Spec.md` + `SETUP-GUIDE.md §4` — 15 min
2. Re-persist 00 artifacts: `builds/00-omni-chat-core-prototype.json` (71 nodes v0.1.13 `eeO8Jl1VeK2f2Z9d`), `designs/00`, `REBUILD-RUNBOOK.md`, `import-manifest.json` (`golive_prep_2026_08_25`) — 10 min
3. Issue human tokens → verify Messenger/IG intake + M3/M4 Sheets per-client prefix (Sheets OAuth/Slack/ Page/IG) — 15 min, you-blocked
4. Full stress + E2E on named tunnel: handshake 3×/3×, `hi→guided` + `bridal→RAG`, 10× volume 100 POSTs/5min p95<20s, dupe `wamid`, outage, quota 429, concurrent → `@reviewer` + `@requirements-reviewer` → deploy-ready

## Artifacts (unified)

- `docs/specs/Omni-Unified-Spec.md` · `docs/plans/Omni-Unified.md` (single source of truth)
- `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes, v0.1.13, ephemeral)
- `blueprints/designs/00-omni-chat-core-blueprint.md §15.5` · `blueprints/sandbox/REBUILD-RUNBOOK.md` · `SETUP-GUIDE.md §§4/4a/4b` · `import-manifest.json` · `config-template.json`

## Uncommitted Files (as of handoff)

~30+ modified files pending commit (site + blueprints + docs). Key: `AGENTS.md`, `CLAUDE.md`, `README.md` (pivot banners), `app/*`, `components/demos/*`, `components/site/*`, `blueprints/BLUEPRINT-PROMPT.md`, `BUGS-AND-QUIRKS.md`, `README.md`, `specs/01..11` (subsumed/retained banners), `public/downloads/*.json`. State files (`state/session-state.json`, `state/handoff/latest.md`, `docs/activeContext.md`) are newly created and untracked. Run `git status --short` before next commit; do not commit without approval.

## Session State Pointer

Read `state/session-state.json` + this handoff + `docs/activeContext.md` first on session start. Plan: `docs/plans/Omni-Unified.md` (active).

---
*Generated: 2026-08-27 EOL — go-live-prep-phase1-verified — tunnel constitutes-cats-wheels-app ephemeral → sandbox named next — 71 nodes v0.1.13 — 79d396d + 2856084 pivot — next_actions 4 deploy tasks*
