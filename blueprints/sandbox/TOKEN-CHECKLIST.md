# TOKEN CHECKLIST — Human Tokens (Omni-Unified Task 3)

> **Business:** NexusAutomations · **Named tunnel (pending):** `nexusautomations-sandbox` → `nexusautomations.dev` · **Ephemeral (verified):** `constitutes-cats-wheels-app.trycloudflare.com` (quick tunnel)
> **Scope:** 00-omni-chat-core (71 nodes, `eeO8Jl1VeK2f2Z9d`) — M3/M4 `clientname_*` + reporting 06, Slack `#bookings/#alerts`, Messenger t02 / IG t03
> **References:** [`SETUP-GUIDE.md §§1–2`](./SETUP-GUIDE.md#1-google-test-resources-10-minutes) · [`SETUP-GUIDE.md §4/4a`](./SETUP-GUIDE.md#4-meta-webhook-after-named-tunnel-exists) · [`REBUILD-RUNBOOK.md §8`](./REBUILD-RUNBOOK.md#8-known-gaps-before-go-live) · [`config-template.json`](./config-template.json) · [`Omni-Unified-Spec.md §5`](../../docs/specs/Omni-Unified-Spec.md#5-per-client-config-block)
> **Secrets policy:** No tokens in repo. Placeholders `__FILL__` / `xoxb-...` / `{{CONFIG.*}}` only. Real values → `meta-credentials.env` + `config.local.json` (both gitignored).

---

## 1. Sheets OAuth — Google Cloud `booking-sandbox` (M3/M4 + reporting 06)

**Purpose:** M3 Booking (`XIdIZ2lnp7ZZKQxW`) + M4 Lead (`G95nOwNXvstqOFoP`) log to per-client sheets `clientname_orders` / `clientname_contacts` / `clientname_bookings`; reporting 06 reads `bookings_sheet_template.csv` headers.

**Issuance (human, 10 min — see SETUP-GUIDE §1):**

- [ ] Google Cloud Console (test account) → Create project **`booking-sandbox`**
- [ ] Enable APIs: **Google Sheets API** + **Google Calendar API**
- [ ] OAuth consent screen: **External**, app name `Booking Sandbox`, user type **Testing** → add yourself as test user
- [ ] Credentials → Create **OAuth client ID** → type **Web application** → Authorized redirect URI:
  ```
  http://localhost:5678/rest/oauth2-credential/callback
  ```
  Copy **Client ID** + **Client Secret**
- [ ] Drive → New Google Sheets → File > Import > Upload `bookings-sheet-template.csv` (headers: `booking_id,event_id,customer_name,phone,service,start_at,end_at,status,source,created_at,reminder_attempts,pending_offer`) → rename tab to `testclient_bookings` (matches `CONFIG.bookings_sheet_name`)
- [ ] Copy **spreadsheet id** from URL (`/d/<id>/edit`) → `CONFIG.sheets_spreadsheet_id`
- [ ] Calendar → Settings → Add calendar `Test Client Bookings` → copy **Calendar ID** (`xxxx@group.calendar.google.com`) → `CONFIG.calendar_id` + `CONFIG.calendar_ids[0]`
- [ ] n8n (`http://localhost:5678`) → Credentials → Create **Google Calendar Sandbox** (type **Google Calendar OAuth2 API** or **Google Sheets OAuth2 API** — n8n shares one Google OAuth2) → paste Client ID/Secret → **Sign in with Google** (re-consent)

**Per-client config keys to fill after issuance (`config-template.json` → `config.local.json`):**

| Key | Value |
|-----|-------|
| `google_calendar_credential` | `Google Calendar Sandbox` (n8n credential name) |
| `sheets_spreadsheet_id` | `__FILL__` (long id between `/d/` and `/edit`) |
| `calendar_id` / `calendar_ids[0]` | `__FILL__@group.calendar.google.com` |
| `bookings_sheet_name` | `testclient_bookings` (per-client: `<clientname>_bookings`) |
| Per-client prefix (M3/M4/06) | `<clientname>_orders` / `<clientname>_contacts` / `<clientname>_bookings` — set `bookings_sheet_name` + module sheets; no core-logic edit |

**Verify in n8n:**

1. Sheets write/readback: n8n → Execute `googleSheets` node (or invoke M3/M4 via manual trigger) → `Append` one row to `<clientname>_bookings` → check sheet updated → `Read` range `testclient_bookings!A1:L2` returns row. If 401 → re-consent; 429 → backoff → pending sheet per `Omni-Unified-Spec.md §7`.
2. Calendar: M3 Booking → `Create event` on `calendar_id` → verify in Google Calendar UI + `event_id` written to sheet column B.
3. Reporting 06 (post OAuth): run reporting workflow against `sheets_spreadsheet_id` → confirms rescue/minutes read.

> Gap until re-consent: `REBUILD-RUNBOOK.md §8` — *M3/M4 Sheets OAuth blocked — `clientname_orders/contacts/bookings` + reporting 06 untested until OAuth re-consent.*

---

## 2. Slack — workspace `booking-sandbox` (`#bookings` / `#alerts`)

**Purpose:** `#bookings` (booking notifications), `#alerts` (Error Trigger `t06 → n13 Alert`), owner-notify swap per `CONFIG.slack_enabled`.

**Issuance (human, 10 min — see SETUP-GUIDE §2):**

- [ ] `slack.com` → Create workspace **`booking-sandbox`** → create channels **`#bookings`** + **`#alerts`**
- [ ] `api.slack.com/apps` → Create New App → **From scratch** → name **`sandbox-bot`** → workspace `booking-sandbox`
- [ ] **OAuth & Permissions → Bot Token Scopes** → add `chat:write`, `channels:read`, `channels:join` (+ `chat:write.public` if posting without invite)
- [ ] **Install to Workspace** → copy **Bot User OAuth Token** `xoxb-...`
- [ ] Invite bot to both channels (`/invite @sandbox-bot` in `#bookings` + `#alerts`) or let `channels:join` auto-join on first post
- [ ] n8n → Credentials → Create **Slack Sandbox** (type **Slack API**) → paste `xoxb-...` → `CONFIG.slack_credential = "Slack Sandbox"`; channel names in config stay `bookings` / `alerts` (**no `#`**)

**Per-client config keys to fill after issuance:**

| Key | Value |
|-----|-------|
| `slack_credential` | `Slack Sandbox` (n8n credential name) |
| `slack_bookings_channel` | `bookings` |
| `slack_alerts_channel` | `alerts` |
| `slack_enabled` | `true` |

**Verify in n8n:**

1. Slack post: n8n → `Slack` node (`n13 Alert`) → Post `test — TOKEN-CHECKLIST verify 2026-08-27` to `bookings` → confirm appears in `#bookings`; repeat to `alerts`.
2. Error path: Workflow → `Error Trigger` `t06` → force error (e.g. bad Sheets id) → verify auto-post lands in `#alerts`.
3. If `channel_not_found` → re-invite bot; if `not_in_channel` → `channels:join` + retry.

---

## 3. Meta Page / IG — Page token + IG Professional + `instagram_manage_messages` (Messenger t02 + IG t03)

**Purpose:** 00 core channels `t02 Messenger` / `t03 Instagram` → `t02p/t03p` tag → `n07 Send Messenger` / `n08 Send Instagram` (`httpRequest` 4.5). Until Page token issued, n07/n08 reuse `{{CONFIG.whatsapp_token}}` (see `config-template.json` `_comment_page_token`).

**Issuance (human, 15 min):**

- [ ] Meta Business Suite → Create/choose **Facebook Page** (connected to Business `NexusAutomations`)
- [ ] Connect **Instagram Professional** account to that Page (Instagram → Settings → Account → Switch to Professional → link Page)
- [ ] `developers.facebook.com` → App → **Add product: Messenger** + **Instagram Graph API** → Request permissions: `pages_show_list`, `pages_messaging`, `instagram_basic`, **`instagram_manage_messages`** (submit for review if app in Live mode; Testing mode works with app-admin testers)
- [ ] **Issue Page token:** Graph Explorer or `GET /{page-id}?fields=access_token` with `FB App` → User token with `pages_show_list,pages_messaging` → exchange for **Page access token** (long-lived via `GET /oauth/access_token?grant_type=fb_exchange_token...`). Copy `EAAG...` → `{{CONFIG.page_token}}` (or split `{{CONFIG.messenger_token}}` / `{{CONFIG.instagram_token}}` if you prefer separate placeholders).
- [ ] n8n → Credentials → keep `n07/n08` as **httpRequest Bearer** (no `whatsAppApi` credential). Header stays `Authorization: =Bearer {{CONFIG.page_token}}` after cutover (today `=Bearer {{CONFIG.whatsapp_token}}` until issued).

**Per-client config keys to fill after issuance (`config-template.json` — `_comment_page_token` pending):**

| Key | Value |
|-----|-------|
| `page_token` | `__FILL__ pending — Page/IG token for n07/n08 (runbook §8). Until issued n07/n08 use {{CONFIG.whatsapp_token}}` |
| Optional split | `messenger_token` / `instagram_token` → if split, update n07 header to `=Bearer {{CONFIG.messenger_token}}`, n08 to `=Bearer {{CONFIG.instagram_token}}` |
| `meta_verify_token` | already `{{CONFIG.meta_verify_token}}` (from `meta-credentials.env` `META_VERIFY_TOKEN`) — used by `g21` bracket `query["hub.verify_token"]` |

> Placeholder is intentional: `config-template.json:30` `_comment_page_token` notes *Page/IG tokens pending (REBUILD-RUNBOOK §8). n07/n08 reuse `{{CONFIG.whatsapp_token}}` until Page token issued; when available use `{{CONFIG.page_token}}` and update workflow.* Do not commit real `EAAG...` token.

**Verify in n8n (webhook POST — intake branches):**

1. **Verify layer (GET challenge) — byte-identical repo↔live (see REBUILD-RUNBOOK §6):**
   ```bash
   # Messenger t02v — correct token returns hub.challenge, wrong returns empty
   curl -s "http://localhost:5678/webhook/messenger-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=__FILL_META_VERIFY_TOKEN__"  # → 123
   curl -s "http://localhost:5678/webhook/messenger-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=wrong"  # → (empty)
   # IG t03v — same
   curl -s "http://localhost:5678/webhook/instagram-intake?hub.mode=subscribe&hub.challenge=123&hub.verify_token=__FILL_META_VERIFY_TOKEN__"  # → 123
   ```
   Expect **3× correct PASS + 3× wrong empty PASS** (same matrix as WhatsApp `t01v` on `constitutes-cats-wheels-app` quick tunnel). `g21` must use bracket `query["hub.verify_token"]` + `hub.challenge` → `rw1` echo.

2. **Messenger intake t02 (POST):**
   ```bash
   curl -X POST http://localhost:5678/webhook/messenger-intake \
     -H "Content-Type: application/json" \
     -d '{"object":"page","entry":[{"messaging":[{"sender":{"id":"TEST_PS_ID"},"recipient":{"id":"PAGE_ID"},"message":{"mid":"m_test123","text":"hello messenger"}}]}]}'
   ```
   n8n → `t02 → t02p Tag Messenger (channel=messenger)` → `n01 Normalize` → `g05` → route → `n07 Send Messenger` (httpRequest `POST https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/me/messages` Bearer `{{CONFIG.page_token}}`) → `n04 Log conversation` (Sheets) + `n13 Alert` if error.

3. **Instagram intake t03 (POST):**
   ```bash
   curl -X POST http://localhost:5678/webhook/instagram-intake \
     -H "Content-Type: application/json" \
     -d '{"object":"instagram","entry":[{"messaging":[{"sender":{"id":"TEST_IGSID"},"recipient":{"id":"PAGE_ID"},"message":{"mid":"ig_test123","text":"hello ig"}}]}]}'
   ```
   n8n → `t03 → t03p Tag Instagram` → same normalize/route → `n08 Send Instagram` → log.

4. **After Page token cutover:** Update workflow `n07/n08` headers from `=Bearer {{CONFIG.whatsapp_token}}` to `=Bearer {{CONFIG.page_token}}` (or split tokens) → re-validate both POSTs → confirm Graph API 200 (not 401). Keep outbound as `httpRequest` 4.5 unquoted phone — never re-introduce `whatsApp` 1.1.

> Gap until issuance: `REBUILD-RUNBOOK.md §8` — *Page/IG tokens pending — Messenger/IG branches untested until Page + IG tokens issued.* Tunnel gap also §8 — quick tunnel `constitutes-cats-wheels-app` rotates; prod cutover to `nexusautomations-sandbox.nexusautomations.dev` when named tunnel DNS routed.

---

## Quick status matrix (fill after issuance)

| Token | Issued? | Config key filled? | n8n verify PASS? | Notes |
|-------|---------|--------------------|------------------|-------|
| Sheets OAuth | [ ] | `sheets_spreadsheet_id` [ ] / `calendar_id` [ ] / `Google Calendar Sandbox` [ ] | write→readback [ ] | Needs re-consent per §1 |
| Calendar | [ ] | `calendar_ids[0]` [ ] | create event [ ] | Same OAuth as Sheets |
| Slack xoxb | [ ] | `Slack Sandbox` [ ] | `#bookings` [ ] / `#alerts` [ ] | Scopes `chat:write` etc |
| Page token | [ ] pending | `page_token` [ ] | — | n07/n08 still on `whatsapp_token` |
| IG professional + `instagram_manage_messages` | [ ] | — | t03 POST [ ] | Requires Page linkage |
| Messenger t02 verify | [ ] | `meta_verify_token` [ ] | GET 3×/3× [ ] | Bracket `query["hub.verify_token"]` |
| IG t03 verify | [ ] | `meta_verify_token` [ ] | GET 3×/3× [ ] | Same `g21`/`rw1` |

---

## References

- `SETUP-GUIDE.md §1` — Google test resources (booking-sandbox, Sheets/Calendar APIs, OAuth redirect, Google Calendar Sandbox)
- `SETUP-GUIDE.md §2` — Slack test workspace (booking-sandbox, #bookings/#alerts, sandbox-bot, xoxb)
- `SETUP-GUIDE.md §4/4a/4b` — Meta webhook + httpRequest parity + hi→guided correction
- `REBUILD-RUNBOOK.md §5` — parity checklist (httpRequest 4.5, unquoted phone_number_id, placeholders)
- `REBUILD-RUNBOOK.md §6` — verify layer byte-identical (t01v/t02v/t03v → g21 → rw1)
- `REBUILD-RUNBOOK.md §8` — known gaps (M3/M4 Sheets OAuth blocked, Page/IG pending, ephemeral tunnel)
- `config-template.json` — `{{CONFIG.page_token}}` pending placeholder + `{{CONFIG.meta_verify_token}}` + `{{CONFIG.whatsapp_token}}`
- `blueprints/designs/00-omni-chat-core-blueprint.md §15.5` — outbound detail + bracket notation
