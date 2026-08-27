# Spec: test-sandbox

Scope: repo

# Test Sandbox Specification

Shared, local, near-zero-cost environment for stress-testing every blueprint before production rollout. All blueprints are CONFIG-token driven, so a test client is just a config row pointing at sandbox resources.

## Resources (one-time setup, reused by all blueprints)

| Resource | Details | Used by CONFIG tokens |
| --- | --- | --- |
| n8n | Docker Compose on the dev machine, cloudflared tunnel for public HTTPS webhook URL | webhook_path_whatsapp, webhook_path_form |
| Meta app | One developer app, WhatsApp product, linked WABA, FREE test number | whatsapp_credential, whatsapp_phone_number_id, whatsapp_token, whatsapp_api_version |
| Meta templates | booking_confirm (buttons RESCHED/CANCEL), booking_reminder, booking_recovery, all Utility, en_US, approved once and reused | whatsapp_template_confirm, whatsapp_template_reminder, whatsapp_template_recovery, whatsapp_template_language |
| Test Google account | Test spreadsheet (clientname_bookings tab: booking_id, event_id, customer_name, phone, service, start_at, end_at, status, source, created_at, reminder_attempts, pending_offer), test calendar, Sheets + Calendar APIs enabled | google_calendar_credential, calendar_ids, calendar_id, sheets_spreadsheet_id, bookings_sheet_name |
| Slack workspace | Free workspace, #bookings and #alerts channels, app token | slack_credential, slack_bookings_channel, slack_alerts_channel |

## Constraints

- Test number can message only the 5 whitelisted recipient numbers; rate-limited; never for production.
- Template approval applies even to test numbers; submit once, reuse for all blueprints.
- Instance timezone set per blueprint (schedule triggers run in the instance timezone).
- Findings append to BUGS-AND-QUIRKS.md (append-only, entry template).

## Per-blueprint onboarding checklist

1. Add a test config row (blueprints/sandbox/config-template.json) pointing at the blueprint's own sheet tab, calendar and channels.
2. Import the prototype JSON, register the error workflow (second import stripped to the error branch).
3. Dry-run the happy path end-to-end.
4. Run the section 11 stress tests from the design.
5. Append findings to BUGS-AND-QUIRKS.md; fix defects with version bumps.

## First target

04-booking-reminders (already built). Remaining ten specs: 01 omni-capture, 02 doc-processing, 03 lead-response, 05 voice-receptionist, 06 reporting-ops, 07 support-triage, 08 prospect-outbound, 09 review-management, 10 ecommerce-ops, 11 automation-debugging.

<!-- Parity #3 note: E2E probe hi -> guided prompt is PASS; M1 rules CSV greeting expectation is NOT required. Documented divergence: hi routes to guided prompt fallback (n14 filtering), bridal -> RAG [kb:services] still required. If greeting rule exists in glamour-rules.csv, attach priority/channel diagnostic; otherwise keep guided expectation. See blueprints/sandbox/SETUP-GUIDE.md §4b. -->