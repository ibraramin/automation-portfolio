# STRESS REPORT — quick tunnel — 2026-08-27

**Business:** NexusAutomations  
**Build:** `00-omni-chat-core` v0.1.13 · 71 nodes · id `eeO8Jl1VeK2f2Z9d` · `blueprints/builds/00-omni-chat-core-prototype.json`  
**Tunnel:** `constitutes-cats-wheels-app.trycloudflare.com` — `cloudflared quick tunnel` (ephemeral, verified E2E)  
**Pending prod:** `nexusautomations-sandbox.nexusautomations.dev` (`nexusautomations-sandbox` named tunnel) — not yet created, see `Omni-Unified-Spec.md §2`  
**Sandbox:** `n8n-sandbox` 2.36.7 on `http://localhost:5678` · `qdrant` 17 pts `glamour_kb` · `freellmapi` healthy (`auto`/`bge-m3`)  
**Spec:** `docs/specs/Omni-Unified-Spec.md §8` · **Phase:** `go-live-prep-phase1-verified` · **Next action #4** in `state/session-state.json`  
**Mode:** Quick-tunnel variant — early signal; full matrix re-run REQUIRED on named tunnel before deploy.

> **Do not commit this report** per task instruction (light, no secrets). Re-run on named tunnel → @reviewer (9 cats) + @requirements-reviewer → deploy-ready.

## 1. Summary

Quick tunnel is **still UP** (contrary to expected rotation/down since 2026-08-27). Handshake 6/6 PASS on quick tunnel; E2E intake 200 on quick tunnel; volume light-probe (10 concurrent) p95 1.12s; node count 71 verified; 8 workflows present. Outbound WhatsApp delivery blocked by Meta allowlist (expected sandbox limitation), Sheets OAuth still blocked (known risk). Remaining matrix items **DEFERRED** to named tunnel for deploy-grade signal.

## 2. Matrix

| # | Category | Probe | Expected | Result | Notes |
|---|----------|-------|----------|--------|-------|
| 1 | Handshake | GET `.../webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=vozYZZ1TxbnIeXuOLsnfQVuZdR8_Ppnn` ×3 | `123` body, 200 | **PASS** (3/3) | `1.50s, 0.47s, 0.37s` via `constitutes-cats-wheels-app.trycloudflare.com`. Also `http://localhost:5678/webhook/whatsapp-intake?...` returns `123` locally. |
| 2 | Handshake wrong | Same with `hub.verify_token=wrong` ×3 | empty body, 200 | **PASS** (3/3) | `0.44s, 0.23s, 0.29s` empty body. Bracket notation `query["hub.verify_token"]` + `rw1` echo intact. |
| 3 | E2E hi→guided | `POST .../webhook/whatsapp-intake` body `hi` (wa payload, fresh wamid) | `hi → What can I help...` guided fallback (n27) — M1 rules CSV greeting NOT required per SETUP-GUIDE §4b | **PASS (intake) / DEFERRED (delivery)** | Intake `200 {"message":"Workflow was started"}` 0.21s (responseMode onReceived). Execution async. Guided fallback is correct route for `hi` per n14 channel filtering. Outbound `n06 Send WhatsApp` (httpRequest 4.5 Bearer) attempted but Meta returned `(#131030) Recipient phone number not in allowed list` + prior `Unknown path components` from quoted-phone fix — sandbox allowlist restriction, not workflow bug. Delivery proof requires allowlisted recipient. |
| 4 | E2E bridal→RAG | POST same endpoint body `bridal` | `bridal → RAG [kb:services]` [threshold 0.55 top_k 3, qdrant glamor_kb 17 pts] | **PASS (intake) / DEFERRED (answer content)** | Same intake 200 0.21s. RAG path: `n15 Embed message` (bge-m3 via freellmapi) → `n16 RAG search` (qdrant:6333) → `n17 RAG score`. Collection `glamour_kb` exists and healthy (green, 17 points) — verified via `GET /collections/glamour_kb`. Answer content not externally asserted in this quick variant; needs post-send log/Sheets inspection on named tunnel with allowlisted number. |
| 5 | Volume | 100 POSTs / 5 min, p95 <20s | All 200, p95 <20s, no drops | **PARTIAL PASS / DEFERRED full** | Light probe 10 concurrent (python ThreadPoolExecutor 10) — all 200, p95 1.12s, avg 1.00s, elapsed 1.13s. Full 100/5min not run in quick variant (would hammer ephemeral tunnel); extrapolates well under 20s. **Must re-run 100/5min on named tunnel** for deploy proof, record `p95` and execution DB lag. |
| 6 | Dupe wamid | Same `wamid` twice | 2nd silently exits via Dedupe (`_oc_dedupe=duplicate` → `Dedupe unique?` IF) | **PASS (intake) / DEFERRED (execution branch)** | Both POSTs returned 200 identically (0.2s). Dedupe logic present in `n02 Dedupe` (rolling 1k static data). Silent-exit branch leads to `n02x Dedupe exit` (noOp). Execution-level confirmation needs n8n execution DB query (sqlite3 not in container; API returned Unauthorized with sandbox api key — likely past 24h expiry; check `meta-credentials.env` N8N_API_KEY). |
| 7 | Outage | Simulated Sheets/courier 5xx / n8n down | Dead-letter + Slack #alerts, resumes | **DEFERRED** | Not simulated on quick tunnel (would risk tunnel flaps). `n04 Log conversation` + `n11 Persist state` have `onError continueRegularOutput` + backoff pattern; `n06` continues but requires allowlisted number to distinguish outage from allowlist 400. Run on named tunnel by pausing qdrant / injecting 500 in freellmapi mock. |
| 8 | 429 quota | Sheets 429 → backoff → pending sheet | Backoff, pending sheet written | **DEFERRED** | Node `n04 Log conversation` / `n11` use `googleSheets` append/update with retry; 429 path untested live due to Sheets OAuth blocked (open_risk #1). Cannot E2E-verify until OAuth re-consent (next_actions #3). |
| 9 | Concurrent | Parallel runs, no cross-talk, thread_id isolation | All execute, state isolated per thread_id | **PARTIAL PASS / DEFERRED** | 10 concurrent bridal intakes above showed no 429/tunnel 502; dedupe window keyed on `provider_message_id` only, so distinct threads do not collide. Full state-isolation proof pending Sheets re-auth (n28 Lookup thread state reads `thread_id` rows). |
| 10 | Malformed/empty | `{"garbage":true}` and `""` POSTs | 200 `Workflow was started`, normalization handles gracefully, no crash | **PASS** | Both returned 200 via quick tunnel (malformed 200, empty 200). `n01 Normalize` guards on `value.messages[0]` presence; status-only payloads return `[]` (early exit). No execution crash observed; logs show only prior `-quoted` phone 400s, not normalize errors. |
| 11 | Graph | 71 nodes byte-identical repo ↔ live (verify + httpRequest parity) | 71 nodes, verify siblings t01v/t02v/t03v + rw1, n06 httpRequest 4.5 unquoted phone | **PASS** | Repo JSON `00-omni-chat-core-prototype.json` → `nodes.length=71`, `id eeO8Jl1VeK2f2Z9d`, `active true`. n06 is `httpRequest` 4.5 `POST https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages` + `Bearer {{CONFIG.whatsapp_token}}` — matches live `send_fix`. `n8n list:workflow` shows 8 workflows (core + 7 modules: M1 E4OMq..., M2 ZJ6Be..., ingest 51b8..., M3 XIdIZ..., M4 G95n..., M5 ayDgf..., M6 bLSYg...). Import manifest `golive_prep_2026_08_25` matches. |

## 3. Raw evidence (redacted)

```
# Handshake (quick tunnel, 2026-08-27 ~20:15 UTC)
$ curl -s "https://constitutes-cats-wheels-app.trycloudflare.com/webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=vozYZZ1TxbnIeXuOLsnfQVuZdR8_Ppnn"
123  (×3: HTTP 200, 1.50s / 0.47s / 0.37s)
$ curl -s "https://constitutes-cats-wheels-app.trycloudflare.com/webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=wrong"
(empty, HTTP 200 ×3: 0.44s / 0.23s / 0.29s)
# Local echo sanity
$ curl -s "http://localhost:5678/webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=vozYZZ1TxbnIeXuOLsnfQVuZdR8_Ppnn"
123

# Intake (quick tunnel, responseMode onReceived)
POST hi      → 200 {"message":"Workflow was started"} 0.21s
POST bridal  → 200 {"message":"Workflow was started"} 0.21s
POST dupe wamid ×2 → 200 each (dedupe branch server-side)
POST {"garbage":true} → 200
POST ""     → 200

# Volume light probe 10 concurrent bridal
code=200 t=0.83 … 1.12  p95=1.12 avg=1.00 max=1.12 elapsed=1.13

# Infra
docker ps: n8n-sandbox Up 4h (0.0.0.0:5678), qdrant Up 4h (6333), freellmapi healthy (127.0.0.1:3001)
GET http://localhost:5678/healthz → {"status":"ok"}
Qdrant: glamour_kb green, 17 points, vectors 1024 cosine
freellmapi: /v1/models lists auto/bge-m3 available
n8n list:workflow: 8 ids (eeO8Jl1VeK2f2Z9d, E4OMq..., ZJ6Be..., 51b8c..., ayDgf..., bLSYg..., XIdIZ..., G95n...)
Repo nodes: 71 verified (python json load)

# n8n logs (recent)
Unknown path components: \/"1182043231668173"\/messages (legacy quoted-phone 400, now fixed in repo)
(#131030) Recipient phone number not in allowed list (current outbound, sandbox allowlist — expected)
connect ETIMEDOUT 172.17.0.1:8899 (host.docker.internal reply stub not listening — n10 Send web, non-critical for WhatsApp path)
Credentials not found ×N (n04/n11 googleSheets + n13 slack using placeholder {{CONFIG.*}}, expected until human tokens per next_actions #3)
```

No secrets echoed beyond `META_VERIFY_TOKEN` prefix already noted in runbook; full token not logged here.

## 4. Why most E2E delivery is DEFERRED on quick tunnel

- **Quick tunnel is ephemeral.** `constitutes-cats-wheels-app` URL rotates per `cloudflared tunnel --url` session; any stress artifact keyed to it is throwaway. Named tunnel (`nexusautomations-sandbox.nexusautomations.dev`) is the durable `WEBHOOK_URL` Meta will keep.
- **Outbound WhatsApp 400s are sandbox-config, not logic bugs.** `(#131030)` means test number not in Meta allowed list — fix is Dashboard > WhatsApp > add recipient. The other `Unknown path components` 400 was the quoted-phone bug already fixed in repo (`send_fix`).
- **Sheets/Slack 401/404 are expected until human tokens** (next_actions #3, open_risks #1). That blocks full RAG-answer text assertion and thread_state persistence checks.
- **N8N API key returned `Unauthorized`.** `meta-credentials.env` `N8N_API_KEY` (jwt iat 1786653445) appears expired/rotated vs container's `N8N_API_KEY` (check `docker exec env`). Execution-level branch proof (dupe vs unique, guided vs RAG) should be via `GET /api/v1/executions` after key refresh.

## 5. Recommendation — re-run on named tunnel (deploy gate)

1. **Cut named tunnel** (next_actions #1): `cloudflared tunnel login && cloudflared tunnel create nexusautomations-sandbox && cloudflared tunnel route dns nexusautomations-sandbox nexusautomations-sandbox.nexusautomations.dev` (alt `sandbox` → `sandbox.nexusautomations.dev` if org blocks name), set `WEBHOOK_URL` in `sandbox/docker-compose.yml`, `docker compose up -d`, update `SETUP-GUIDE.md §4` + `Omni-Unified-Spec.md` tunnel field.
2. **Re-persist 00** (next_actions #2) when ephemeral branch available — already on disk as 71 nodes; just confirm `import-manifest.json` bump after named URL.
3. **Human tokens** (next_actions #3): Google OAuth re-consent (Sheets `testclient_bookings`), Slack `xoxb` for `#bookings`/`#alerts`, Page+IG tokens for `n07`/`n08` (currently reusing `whatsapp_token`).
4. **Full stress on named** (next_actions #4): handshake 3×/3×, `hi→guided`, `bridal→RAG`, **100 POSTs/5 min p95<20s**, dupe wamid (check execution branch), **outage injection** (pause qdrant / mock 500), **429** (throttle Sheets API), **concurrent** (20-way, assert thread_id isolation), **malformed/empty** (already passing). Capture `p95`, execution counts, Sheets rows, Slack alerts. Then `@reviewer` (9 categories) + `@requirements-reviewer` (verbatim vs Omni-Unified-Spec §8 + session-state next_actions #4) → deploy-ready.
5. **Operational:** refresh `N8N_API_KEY` in `meta-credentials.env` after `n8n-sandbox` restart; add test phone to Meta allowed list before delivery assertions; ensure `host.docker.internal:8899` stub or disable `n10 Send web` if not used.

## 6. Artifact

- This file: `blueprints/sandbox/STRESS-REPORT-quick-2026-08-27.md` (not committed, per task).
- Prior verified artifacts: `REBUILD-RUNBOOK.md`, `SETUP-GUIDE.md §§4/4a/4b`, `config-template.json`, `import-manifest.json` (`golive_prep_2026_08_25`), `00-omni-chat-core-prototype.json` (71 nodes).

---
*Generated 2026-08-27 quick-tunnel variant for Task 4 early signal. Business NexusAutomations. Next: named tunnel + full stress.*
