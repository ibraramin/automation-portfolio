---
plan name: sandbox-setup
plan description: Stress-test environment for blueprints
plan status: active
---

## Idea
Build a shared local test environment to stress-test every blueprint before any production rollout. The sandbox runs n8n in Docker on the developer machine with a cloudflared tunnel so Meta and other webhooks can reach it, plus one Meta developer app with the free WhatsApp test number and three approved test templates, a dedicated test Google account (spreadsheet with the bookings tab columns from design section 6, plus a test calendar), and a free Slack workspace with #bookings and #alerts channels. All blueprints are 100 percent CONFIG-token driven, so each service only needs a test config row pointing at its own sheets, calendar and channels inside the shared sandbox. The harness then runs each blueprint's happy path plus the section 11 stress tests (duplicate intake dedupe, unavailable-slot alternatives, concurrent same-slot race, simulated calendar outage, reminder timing, no-show recovery) and appends every finding to BUGS-AND-QUIRKS.md, fixing defects in the artifacts with version bumps. First target is 04-booking-reminders; the remaining ten spec sheets (01 omni-capture through 11 automation-debugging) follow the same onboarding checklist.

## Implementation
- Stand up local n8n via Docker Compose (postgres or sqlite) plus a cloudflared tunnel; capture the public HTTPS webhook URL and document the docker-compose file in blueprints/sandbox/
- Create the Meta developer app with the WhatsApp product, link a WABA, claim the free test number, whitelist 5 test recipient numbers, and generate the phone number id and a permanent system-user access token
- Submit the three test templates (booking_confirm with RESCHED/CANCEL quick-reply payloads, booking_reminder, booking_recovery) using the drafts already prepared, and wait for approval
- Create the test Google account resources: test spreadsheet with the clientname_bookings tab (12 columns from design section 6 plus reminder_attempts and pending_offer), test calendar, enable Calendar and Sheets APIs, and register the OAuth credentials in n8n; create the free Slack workspace with #bookings and #alerts channels and an app token
- Write the sandbox config: blueprints/sandbox/config-template.json with test values for all 34 CONFIG tokens, plus the per-blueprint config row convention documented in a sandbox README
- Import builds/04-booking-reminders-prototype.json into the test n8n, set the instance timezone to Asia/Dhaka, register the error workflow (second import stripped to t06+n73), fill the CONFIG values, and activate the workflow
- Wire the Meta webhook: register the tunnel URL for t01 with the verify token, subscribe to the messages field, and confirm the handshake
- Run the 04 happy path dry-runs: web form intake, WhatsApp free-text intake, confirmation with a Cancel button reply, reschedule via the RESCHED payload, reminder sweep with faked start_at timestamps, and no-show recovery
- Run the 04 stress tests from design section 11: duplicate intake dedupe within 10 minutes, unavailable-slot alternatives, 5 concurrent same-slot bookings with exactly one event, simulated calendar outage with fail-safe and Slack alert, reminder timing 25h out sending 24h and 2h without duplicates, and no-show recovery reusing the booking_id
- Append every finding to BUGS-AND-QUIRKS.md (append-only template), fix defects in the 04 artifacts with version bumps, and write the per-blueprint onboarding checklist (config row, dry-run, stress tests) for the remaining ten specs into the sandbox README

## Required Specs
<!-- SPECS_START -->
- test-sandbox
<!-- SPECS_END -->