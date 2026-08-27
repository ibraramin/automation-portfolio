# REBUILD RUNBOOK — 00-omni-chat-core (71 nodes v0.1.13, id eeO8Jl1VeK2f2Z9d)

> **Business:** NexusAutomations · **Named tunnel (pending):** `nexusautomations-sandbox` → `nexusautomations.dev` · **Ephemeral quick tunnel (verified):** `constitutes-cats-wheels-app.trycloudflare.com` · **Status:** `ephemeral-pending-re-persist` until named tunnel cutover. See `SETUP-GUIDE.md` §§4/4a/4b + `Omni-Unified-Spec.md`.

## 1. When to use this runbook

- Fresh n8n sandbox or new client clone
- After ephemeral commit `2e3e6bc` was unreachable (only `04-*` on disk; 00 artifacts needed re-persist)
- After live parity fix `send_fix` (httpRequest) — repo must be re-importable without 500
- Before `golive_prep_*` manifest bump + full stress/E2E

## 2. Pre-reqs

- `n8n-sandbox` running: `docker compose up -d` in `blueprints/sandbox` (n8n on `http://localhost:5678`, timezone `Asia/Dhaka`)
- Tunnel: **quick** `cloudflared tunnel --url http://localhost:5678` (random URL, verify with `constitutes-cats-wheels-app…`) **or** **named** (prod):

  ```bash
  cloudflared tunnel login
  cloudflared tunnel create nexusautomations-sandbox
  # alt if org disallows that name: cloudflared tunnel create sandbox
  cloudflared tunnel route dns nexusautomations-sandbox nexusautomations-sandbox.nexusautomations.dev
  # alt: sandbox.nexusautomations.dev
  ```

  Then in `docker-compose.yml` uncomment `WEBHOOK_URL=https://nexusautomations-sandbox.nexusautomations.dev` (or alt) and `docker compose up -d`.

- `sandbox/meta-credentials.env` with `N8N_API_KEY` + `N8N_MAIN_WORKFLOW_ID=x0iyQIXCSNe86X3z` + Meta tokens (gitignored). `config-template.json` has `{{CONFIG.meta_verify_token}}` placeholder.

## 3. 8-workflow import order (dependencies first)

Import **in this order** via n8n UI `Workflows → … → Import from File` or `n8n import:workflow`:

| Order | Workflow file (repo) | Live id | Name | Notes |
|---|---|---|---|---|
| 1 | *(live export →)* `Omni-M2-RAG-Ingest.json` | `51b8c8v2NK6WEd9S` | Omni M2 RAG Ingest | Ingest `kb:services` to Qdrant; no deps |
| 2 | `Omni-M2-RAG-Retrieval.json` | `ZJ6BeDNECT4bYFFC` | Omni M2 RAG Retrieval | Embed + Qdrant query; threshold 0.55 |
| 3 | `Omni-M1-Rules.json` | `E4OMq15MVN02rvMM` | Omni M1 Rules | readWriteFile + extractFromFile |
| 4 | `Omni-M3-Booking.json` | `XIdIZ2lnp7ZZKQxW` | Omni M3 Booking | Calendar/ Sheets (04 slice folded) |
| 5 | `Omni-M4-Lead-Capture.json` | `G95nOwNXvstqOFoP` | Omni M4 Lead Capture | Lead CRM |
| 6 | `Omni-M5-Support-Triage.json` | `ayDgfI4zsTn80Erq` | Omni M5 Support Triage | KB triage |
| 7 | `Omni-M6-Handoff.json` | `bLSYgRzPGzwGju6i` | Omni M6 Handoff | Human handoff |
| 8 | **`blueprints/builds/00-omni-chat-core-prototype.json`** | **`eeO8Jl1VeK2f2Z9d`** | **Omni Chat Core (71 nodes)** | **Core — imports last, calls 1–7 via Execute Workflow** |

If only re-importing the core (e.g. parity patch), importing 8 alone is safe if 1–7 are already active. For a clean sandbox, import 1→8 and **activate each** after filling `{{CONFIG.*}}`.

> Export source: all 8 ids visible via `docker exec n8n-sandbox n8n list:workflow` (n8n-sandbox container). IDs above are the live ids at v0.1.13; if you re-create workflows the ids change — update this runbook + `import-manifest.json`.

## 4. Export live workflow (to re-persist repo JSON)

### Option A — N8N API (when API key valid)

```bash
# load key from env (gitignored)
set -a; source blueprints/sandbox/meta-credentials.env; set +a
curl -s http://localhost:5678/api/v1/workflows/x0iyQIXCSNe86X3z \
  -H "X-N8N-API-KEY:$N8N_API_KEY" | python3 -m json.tool > /tmp/live.json
# also list all:
curl -s http://localhost:5678/api/v1/workflows -H "X-N8N-API-KEY:$N8N_API_KEY" | python3 -m json.tool | head -n 60
```

If API returns `Unauthorized` (key rotation / n8n auth mode), use Option B.

### Option B — CLI export (always works inside container)

```bash
# list
docker exec n8n-sandbox n8n list:workflow
# export single (pretty, single file)
docker exec n8n-sandbox n8n export:workflow --id=eeO8Jl1VeK2f2Z9d --pretty --output=/tmp/00-export.json
docker cp n8n-sandbox:/tmp/00-export.json /tmp/00-export.json
# export all (one file per workflow, for backups)
docker exec n8n-sandbox n8n export:workflow --all --pretty --separate --output=/tmp/backups/
```

### Option C — UI

n8n UI → Workflows → `Omni Chat Core` → `… → Export` / `Download` → save as `00-omni-chat-core-prototype.json`.

### After export → sanitize for repo

Live has hardcoded secrets (`v24.0`, `1182043231668173`, `Bearer EAAS...`, `vozYZZ...`, `freellmapi-...`). **Before committing**, replace:

- `n06 Send WhatsApp` url → `https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages`
  header `Authorization` → `=Bearer {{CONFIG.whatsapp_token}}`
  type must stay `httpRequest` 4.5, no `whatsAppApi` credential

- `n15 Embed message` header `Authorization: Bearer freellmapi-...` → `=Bearer {{CONFIG.freellmapi_token}}` (from `config-template.json` / `meta-credentials.env FREELLMAPI_TOKEN`; see §5)
- `n18 LLM classify` header `Authorization: Bearer freellmapi-...` → `=Bearer {{CONFIG.freellmapi_token}}` (same placeholder; live value gitignored in `meta-credentials.env`)
- `g21 Meta token ok?` rightValue `vozYZZ1TxbnIeXuOLsnfQVuZdR8_Ppnn` → `={{CONFIG.meta_verify_token}}`
  leftValue must be bracket: `={{ $json.query["hub.verify_token"] }}` (not dot)

- `staticData.global.omni_dedupe_window` → `[]` — live export leaks 10 wamids (`golive-1:0`, `wamid.test123` etc) from E2E probes; reset to empty array for clean repo import (sanitized, not deleted — window re-populates at runtime). If you see `golive-1:0` style ids, wipe them here.

Add top-level `_comment` explaining sanitization + `versionId: v0.1.13`, keep `id: eeO8Jl1VeK2f2Z9d`. Validate:

```bash
python3 -m json.tool blueprints/builds/00-omni-chat-core-prototype.json > /dev/null && echo "json ok"
python3 -c "import json; d=json.load(open('blueprints/builds/00-omni-chat-core-prototype.json')); assert len(d['nodes'])==71, len(d['nodes']); n06=[n for n in d['nodes'] if n['id']=='n06'][0]; assert n06['type']=='n8n-nodes-base.httpRequest' and n06['typeVersion']==4.5, 'n06 parity'; assert '{{CONFIG.whatsapp_phone_number_id}}' in n06['parameters']['url'] and '\"{{' not in n06['parameters']['url']; print('71 nodes, n06 httpRequest 4.5 unquoted ok')"
```

## 5. Parity fix checklist (must pass before manifest bump)

From `BUGS-AND-QUIRKS.md #10` + `SETUP-GUIDE.md §4a`:

- [ ] **whatsApp 1.1 → httpRequest 4.5:** `n06` is `n8n-nodes-base.httpRequest` 4.5, **not** `n8n-nodes-base.whatsApp` 1.1. No `credentials.whatsAppApi` on `n06`.
- [ ] **Quoted → unquoted phone_number_id:** URL and JSON body use `{{CONFIG.whatsapp_phone_number_id}}` **unquoted** (never `"{{CONFIG.whatsapp_phone_number_id}}"`).
- [ ] **Bearer token:** `Authorization: =Bearer {{CONFIG.whatsapp_token}}` (from `config-template.json` / `meta-credentials.env META_ACCESS_TOKEN`). Live redacted as `DEMO` / `EAAS...` — repo must have placeholder.
- [ ] **`whatsAppApi` credential removal:** No `whatsAppApi` credential for outbound sends; inbound verify has no auth. Old `REBUILD-RUNBOOK.md` n05 `whatsapp_credential` does **not** apply to `n06`.
- [ ] **`meta_verify_token` placeholder:** `g21` rightValue is `={{CONFIG.meta_verify_token}}` (placeholder), leftValue is `={{ $json.query["hub.verify_token"] }}` bracket. Live hardcoded `vozYZZ...` must not be in repo.
- [ ] **`freellmapi_token` placeholder:** `n15`/`n18` headers are `=Bearer {{CONFIG.freellmapi_token}}` (from `config-template.json` / `meta-credentials.env FREELLMAPI_TOKEN`), not hardcoded `freellmapi-3cc...`. Live value stays gitignored; repo must have placeholder (if dummy dev token, document exception).
- [ ] **Dedupe window sanitized:** `staticData.global.omni_dedupe_window` is `[]`, not leaking 10 wamids (`golive-1:0`, `wamid.test...`) from probes — clean import requirement (§4).
- [ ] **Other sends consistent:** `n07/n08` Messenger/Instagram also `httpRequest` 4.5 with same Bearer placeholder — keep. They currently reuse `{{CONFIG.whatsapp_token}}` until Page/IG tokens issued (see `config-template.json` `_comment_page_token` and §8 Known gaps); when `{{CONFIG.page_token}}` is available, update n07/n08 headers. Do not leave hardcoded Page token in repo.
- [ ] **Import does not 500:** Fresh import of `00-omni-chat-core-prototype.json` activates without missing-credential error.

## 6. Verify layer — byte-identical check

Repo ↔ live must be byte-identical for the GET challenge path (divergence only for token **value** placeholder — see §5).

Nodes:

- `t01v WhatsApp verify` — webhook `GET whatsapp-intake`, `responseMode responseNode`
- `t02v Messenger verify` — `GET messenger-intake`
- `t03v Instagram verify` — `GET instagram-intake`
- `g21 Meta token ok?` — `IF` with:

  ```js
  leftValue:  ={{ $json.query["hub.verify_token"] }}   // bracket notation, not dot
  rightValue: ={{CONFIG.meta_verify_token}}
  leftValue2: ={{ $json.query["hub.challenge"] }} notEmpty
  combinator: and
  ```

- `rw1 Respond challenge` — `respondToWebhook` `respondWith: text`, `responseBody: ={{ $json.query["hub.challenge"] }}`

Connections byte-identical:

```
t01v → g21 → rw1
t02v → g21
t03v → g21
g21 true → rw1, false → (empty)
```

Validate handshake on the tunnel:

```bash
# should return hub.challenge when token matches, empty on wrong token
curl -s "https://<tunnel>/webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token={{CONFIG.meta_verify_token}}"  # → 123
curl -s "https://<tunnel>/webhook/whatsapp-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=wrong"                     # → (empty)
```

Three correct + three wrong must PASS (as done on `constitutes-cats-wheels-app.trycloudflare.com`).

## 7. How to update import-manifest.json

File: `blueprints/sandbox/import-manifest.json`

```json
{
  "build": "00-omni-chat-core",
  "version": "v0.1.13",
  "id": "eeO8Jl1VeK2f2Z9d",
  "tunnel": "constitutes-cats-wheels-app.trycloudflare.com",
  "named_tunnel": "nexusautomations-sandbox",
  "status": "ephemeral-pending-re-persist",
  "golive_prep": "2026_08_25",
  "parity": ["httpRequest 4.5", "unquoted phone_number_id", "meta_verify_token placeholder", "hi->guided"]
}
```

When bumping (e.g. named tunnel cutover or `golive_prep_2026_08_28`):

1. Export live per §4, apply §5 checklist, validate 71 nodes + `n06` httpRequest.
2. Run handshake 3×/3× + E2E `hi→guided` + `bridal→RAG [kb:services]` per `Omni-Unified-Spec.md` §8.
3. Update `version`, `tunnel` (to `nexusautomations-sandbox.nexusautomations.dev` after cutover), `named_tunnel`, `golive_prep` date, `status` (`active` when named+tunnel verified).
4. Validate: `python3 -m json.tool import-manifest.json > /dev/null && echo "manifest json ok"`

## 8. Known gaps (before go-live)

- `M3/M4 Sheets OAuth` blocked — `clientname_orders/contacts/bookings` + reporting 06 untested until OAuth re-consent
- `Page/IG tokens` pending — Messenger/IG branches untested until Page + IG tokens issued
- Tunnel ephemeral — `constitutes-cats-wheels-app` rotates per `cloudflared` session; cut to `nexusautomations-sandbox` for prod

## 9. References

- `docs/specs/Omni-Unified-Spec.md` — unified spec (71 nodes, tunnel, verify, outbound, RAG)
- `blueprints/designs/00-omni-chat-core-blueprint.md` §15.5 — outbound detail + version history
- `blueprints/sandbox/SETUP-GUIDE.md` §§4/4a/4b — tunnel + httpRequest parity + hi→guided correction
- `blueprints/BUGS-AND-QUIRKS.md` #10 — send_fix lesson
- `blueprints/sandbox/config-template.json` — `{{CONFIG.meta_verify_token}}` placeholder
- `blueprints/builds/04-booking-reminders-prototype.json` — canonical 04 slice reference (superseded)
