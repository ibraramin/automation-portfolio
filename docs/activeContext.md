> **Pivot banner (2026-08-27): unified 00-omni-chat-core is main build — 71 nodes v0.1.13, tunnel nexusautomations-sandbox pending nexusautomations.dev (constitutes-cats-wheels-app ephemeral quick verified 6/6), 01–10 subsumed except 11. Source: docs/specs/Omni-Unified-Spec.md · docs/plans/Omni-Unified.md**

# Active Context — Ideas2

**Current task:** EOL — go-live-prep-phase2-quick-verified — 00 re-persist APPROVED pending git persist (named tunnel domain), token checklist done, quick stress 6/6 PASS

**Recent decisions:**
- 2026-08-27 pivot: 00-omni-chat-core is main build, subsumes 01–10 (04 superseded slice), 11 separate — `Omni-Unified-Spec.md` single source of truth.
- Tunnel `constitutes-cats-wheels-app.trycloudflare.com` = ephemeral quick tunnel still UP 6/6 PASS 2026-08-27; prod = named `nexusautomations-sandbox` pending `nexusautomations.dev` (WEBHOOK_URL commented until route dns).
- 71 nodes v0.1.13 `eeO8Jl1VeK2f2Z9d` re-persisted with proper docs — httpRequest 4.5 unquoted, `{{CONFIG.meta_verify_token}}` bracket, `{{CONFIG.freellmapi_token}}` + `page_token`, dedupe `[]` — @reviewer APPROVED rev-2.
- TOKEN-CHECKLIST.md 158 lines + STRESS-REPORT-quick 6/6 PASS created; @requirements BLOCKED pending named tunnel git persist (expected).

**In progress:**
- `go-live-prep-phase2-quick-verified` — quick tunnel 6/6 handshake PASS, 00 on disk APPROVED (ephemeral-pending-re-persist), token checklist ready — awaiting `nexusautomations.dev` buy for named tunnel + human token issuance

**Next (3 tasks after quick verify):**
1. Buy nexusautomations.dev → `cloudflared tunnel create nexusautomations-sandbox` + `route dns` + WEBHOOK_URL + `docker compose up -d` + `git add` 00×4 → active
2. Issue human tokens via TOKEN-CHECKLIST.md (Sheets OAuth clientname_* + Slack xoxb + Page+IG) and verify Messenger/IG branches — you-blocked
3. Full stress + E2E on named tunnel: handshake 3×/3×, hi→guided + bridal→RAG [kb:services], 100 POSTs/5min p95<20s, dupe, outage, 429, concurrent → @reviewer + @requirements-reviewer → deploy-ready

**Blockers:**
- Named tunnel + domain nexusautomations.dev — requires buy + cloudflared create/route.
- M3/M4 Sheets OAuth + Page/IG tokens — you-blocked via TOKEN-CHECKLIST.

**Artifacts:** `Omni-Unified-Spec.md` · `Omni-Unified.md` · `00-omni-chat-core-prototype.json` (71) · `REBUILD-RUNBOOK.md` · `TOKEN-CHECKLIST.md` · `STRESS-REPORT-quick-2026-08-27.md` · `SETUP-GUIDE.md §§4/4a/4b`

**State pointers:** Read `state/session-state.json` + `state/handoff/latest.md` first on every new session.

---
*Teams: site (Next.js, 6 demos, Cloudflare static) + unified blueprint (00) + 11 runbook. 01–10 traceability retained.*
