> **Pivot banner (2026-08-27): unified 00-omni-chat-core is main build — 71 nodes v0.1.13, tunnel constitutes-cats-wheels-app (ephemeral quick tunnel), 01–10 subsumed except 11. Source: docs/specs/Omni-Unified-Spec.md · docs/plans/Omni-Unified.md**

# Active Context — Ideas2

**Current task:** unified pivot docs update — edit (not erase) agent memory/context to reflect omni-core pivot; create/update `state/` + `docs/activeContext.md` + banners in `README.md`/`AGENTS.md`/`CLAUDE.md` so new agent reads unified context first.

**Recent decisions:**
- 2026-08-27 pivot: 00-omni-chat-core is main build, subsumes 01–10 (04 superseded slice), 11 separate — `Omni-Unified-Spec.md` single source of truth.
- Tunnel `constitutes-cats-wheels-app.trycloudflare.com` = ephemeral quick tunnel; prod = named tunnel `sandbox`.
- 71 nodes v0.1.13, parity fixes `79d396d` (httpRequest 4.5 outbound not whatsAppApi, `{{CONFIG.meta_verify_token}}`, unquoted `phone_number_id`, hi→guided bridal→RAG, bracket `hub.verify_token`).
- Banners prepended to `Portfolio-Repo-Spec`, `Portfolio-Feature-Spec`, `Automation-Portfolio` plan (history preserved).

**In progress:**
- Go-live-prep-phase1-verified — WhatsApp E2E verified (hi→guided, bridal→RAG [kb:services]); quick-tunnel handshake 3x correct/3x wrong PASS.

**Next:**
- Page/IG tokens (Messenger/IG intake) + create named tunnel `sandbox` + re-persist 00 artifacts (`builds/00-prototype.json`, `REBUILD-RUNBOOK.md`, `import-manifest.json` `golive_prep_2026_08_25`) when branch available.
- Re-run full stress matrix on named tunnel (10x volume p95<20s, dupe wamid, outage, quota 429, concurrent) → `@reviewer` + `@requirements-reviewer` → commit.

**Blockers:**
- M3/M4 Sheets OAuth blocked (Sheets 429/backoff untested live).
- Tunnel ephemeral (URL rotates); named tunnel not yet created.
- Page/IG tokens pending.

**Artifacts:** `docs/specs/Omni-Unified-Spec.md` · `docs/plans/Omni-Unified.md` · `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes) · `blueprints/sandbox/REBUILD-RUNBOOK.md` · `SETUP-GUIDE.md §§4/4a/4b`

**State pointers:** Read `state/session-state.json` + `state/handoff/latest.md` first on every new session.

---
*Teams: site (Next.js, 6 demos, Cloudflare static) + unified blueprint (00) + 11 runbook. 01–10 traceability retained.*
