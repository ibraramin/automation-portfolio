> **Pivot banner (2026-08-27): unified 00-omni-chat-core is main build — 71 nodes v0.1.13, tunnel constitutes-cats-wheels-app (ephemeral quick tunnel), 01–10 subsumed except 11. Source: docs/specs/Omni-Unified-Spec.md · docs/plans/Omni-Unified.md**

# Active Context — Ideas2

**Current task:** EOL — deploy omni-chat-core (4 tasks) — todo saved to `state/session-state.json` next_actions; ready for `/new`

**Recent decisions:**
- 2026-08-27 pivot: 00-omni-chat-core is main build, subsumes 01–10 (04 superseded slice), 11 separate — `Omni-Unified-Spec.md` single source of truth.
- Tunnel `constitutes-cats-wheels-app.trycloudflare.com` = ephemeral quick tunnel; prod = named tunnel `sandbox`.
- 71 nodes v0.1.13, parity fixes `79d396d` (httpRequest 4.5 outbound not whatsAppApi, `{{CONFIG.meta_verify_token}}`, unquoted `phone_number_id`, hi→guided bridal→RAG, bracket `hub.verify_token`).
- Banners prepended to `Portfolio-Repo-Spec`, `Portfolio-Feature-Spec`, `Automation-Portfolio` plan (history preserved).

**In progress:**
- `go-live-prep-phase1-verified` — WhatsApp E2E `hi→guided` + `bridal→RAG` PASS on quick tunnel `constitutes-cats-wheels-app` (ephemeral); parity `79d396d` + pivot `2856084` verified

**Next (4 deploy tasks — convenience order):**
1. Create named tunnel `sandbox` (cloudflared tunnel create sandbox + route dns + WEBHOOK_URL) and swap ephemeral `constitutes-cats-wheels-app` URL; update `SETUP-GUIDE.md §4` + `Omni-Unified-Spec.md` tunnel field — 15 min, mechanical
2. Re-persist 00 artifacts when ephemeral branch available: `builds/00-omni-chat-core-prototype.json` (71 nodes v0.1.13 `eeO8Jl1VeK2f2Z9d`), `designs/00 §15.5`, `REBUILD-RUNBOOK.md`, `import-manifest.json` (`golive_prep_2026_08_25`) — 10 min, needs 1
3. Issue human tokens (Sheets OAuth for M3/M4 `clientname_orders/contacts/bookings` + reporting 06, Slack `xoxb` for `#bookings/#alerts`, Page token + IG professional + `instagram_manage_messages`) and verify Messenger/IG intake branches — 15 min, you-blocked, parallelizable
4. Full stress + E2E on named tunnel: handshake 3× correct/3× wrong, `hi→guided` + `bridal→RAG [kb:services]`, 10× volume 100 POSTs/5min p95<20s, dupe `wamid`, outage, 429 quota, concurrent → `@reviewer` (9 cats) + `@requirements-reviewer` → deploy-ready

**Blockers:**
- M3/M4 Sheets OAuth blocked (Sheets 429/backoff untested live).
- Tunnel ephemeral (URL rotates); named tunnel not yet created.
- Page/IG tokens pending.

**Artifacts:** `docs/specs/Omni-Unified-Spec.md` · `docs/plans/Omni-Unified.md` · `blueprints/builds/00-omni-chat-core-prototype.json` (71 nodes) · `blueprints/sandbox/REBUILD-RUNBOOK.md` · `SETUP-GUIDE.md §§4/4a/4b`

**State pointers:** Read `state/session-state.json` + `state/handoff/latest.md` first on every new session.

---
*Teams: site (Next.js, 6 demos, Cloudflare static) + unified blueprint (00) + 11 runbook. 01–10 traceability retained.*
