> **Superseded slice — see unified 00-omni-chat-core. Retained for traceability.**

# Bookings and No-Show Recovery: Founder Implementation Guide

A plain-language companion to the design document; read this first, then import the prototype.

## What this service does

A booking request from WhatsApp, a web form or email becomes a confirmed Google Calendar event, with a confirmation, reminders 24 and 2 hours before, and a no-show recovery with instant rebooking. Your team gets a Slack message for every new booking and recovery rebooking (or a WhatsApp owner note when {{CONFIG.slack_enabled}} is false).

## How to import the prototype

1. Open your n8n instance in the browser.
2. Go to Workflows, click the dropdown next to Add Workflow, and choose Import from File.
3. Pick `blueprints/builds/04-booking-reminders-prototype.json`.
4. After import, the canvas shows one workflow named "Bookings and No-Show
   Recovery" with 101 nodes. Six are triggers: two webhooks (WhatsApp and Web
   form intake), a disabled email trigger, two schedule triggers (Reminder
   and No-show sweep) and the Error trigger.
5. Also import the same file a second time as "Booking Error Alerts". In that
   copy, delete every node except Error trigger, Alert?, Slack alert and
   Owner alert, then in the main workflow settings register "Booking Error
   Alerts" as the error workflow.

## The {{CONFIG.x}} value table

Every client-specific value in the workflow is a token like
{{CONFIG.whatsapp_phone_number_id}}. Fill them in n8n Settings, Variables
(recommended) or in the first Code node, then replace each token before testing.

| Token | What to put in it | Example |
| --- | --- | --- |
| {{CONFIG.google_calendar_credential}} | The exact n8n credential name for Google Calendar | "Google Calendar (Salon)" |
| {{CONFIG.calendar_ids}} | The calendar id(s) for availability queries | "primary" or the shared calendar email |
| {{CONFIG.calendar_id}} | The primary calendar id for event creation | "primary" or the shared calendar email |
| {{CONFIG.services}} | Service names with duration and price | {"Haircut": {"duration_minutes": 60, "price": 800}} |
| {{CONFIG.business_hours}} | Open, close and working days | {"open": "10:00", "close": "20:00", "days": [1,2,3,4,5,6]} |
| {{CONFIG.timezone}} | Your IANA timezone | Asia/Dhaka |
| {{CONFIG.whatsapp_credential}} | The n8n WhatsApp Cloud API credential name | "WhatsApp Business" |
| {{CONFIG.whatsapp_template_confirm}} | Approved confirmation template id | booking_confirm |
| {{CONFIG.whatsapp_template_reminder}} | Approved reminder template id | booking_reminder |
| {{CONFIG.whatsapp_template_recovery}} | Approved recovery template id | booking_recovery |
| {{CONFIG.whatsapp_template_language}} | Template language code | en_US |
| {{CONFIG.whatsapp_phone_number_id}} | Meta phone number id for the Graph API | 105392881234567 |
| {{CONFIG.whatsapp_token}} | Meta WhatsApp Cloud API access token | EAAG... |
| {{CONFIG.whatsapp_api_version}} | Graph API version for the messages url | v21.0 |
| {{CONFIG.phone_country_code}} | Country code for local phone numbers | 880 |
| {{CONFIG.webhook_path_form}} | The webhook path for the booking form | booking-form |
| {{CONFIG.webhook_path_whatsapp}} | The webhook path for WhatsApp | booking-whatsapp |
| {{CONFIG.sheets_spreadsheet_id}} | The Google Sheets spreadsheet id | 1AbC... |
| {{CONFIG.bookings_sheet_name}} | The sheet tab name | glamourbookings |
| {{CONFIG.slack_credential}} | The n8n Slack credential name | "Slack Studio" |
| {{CONFIG.slack_bookings_channel}} | The channel for booking news | bookings |
| {{CONFIG.slack_alerts_channel}} | The channel for alerts | alerts |
| {{CONFIG.slack_enabled}} | "true" uses Slack for team alerts, "false" uses the owner WhatsApp template | true |
| {{CONFIG.owner_whatsapp_number}} | The owner's WhatsApp number for team alerts | 8801712345678 |
| {{CONFIG.whatsapp_template_owner}} | Approved owner alert template id | booking_owner_notify |
| {{CONFIG.reminder_lead_24h}} | Hours before start for the first reminder | 24 |
| {{CONFIG.reminder_lead_2h}} | Hours before start for the second reminder | 2 |
| {{CONFIG.no_show_grace_minutes}} | Minutes after start to call a no-show | 30 |
| {{CONFIG.location_text}} | Branch address or location text | "House 12, Road 5, Dhanmondi" |
| {{CONFIG.client_name}} | Your display name for calendar and Slack | "Glamour Salon" |
| {{CONFIG.booking_id_prefix}} | Booking id prefix | BK |
| {{CONFIG.dedupe_window_minutes}} | Duplicate window for the same request | 10 |
| {{CONFIG.max_reminder_attempts}} | Max reminder attempts before alerting | 3 |
| {{CONFIG.recovery_slot_count}} | Number of slots offered | 3 |
| {{CONFIG.slot_step_minutes}} | Step between offered slots | 30 |
| {{CONFIG.attendance_marker}} | Text the team appends to mark attendance | [ATTENDED] |
| {{CONFIG.email_imap_credential}} | IMAP credential (only if email intake is on) | "Studio Mail" |
| {{CONFIG.email_intake_folder}} | IMAP folder to poll | INBOX |

## Credentials checklist

Create these in n8n Credentials with exactly these names; the nodes pick up
the credential by name.

| Integration | What to create | Exact credential name |
| --- | --- | --- |
| Google Calendar | OAuth 2.0 or service account with Calendar API enabled | {{CONFIG.google_calendar_credential}} |
| Google Sheets | Same Google account, Sheets API enabled | Same credential as above |
| WhatsApp | Meta app with WhatsApp Cloud API, business number and token | {{CONFIG.whatsapp_credential}} |
| Slack | Slack app with chat:write and incoming webhooks | {{CONFIG.slack_credential}} |
| Email (optional) | IMAP app password | {{CONFIG.email_imap_credential}} |

Also in Meta: submit the four templates (confirm with Reschedule and Cancel
buttons, reminder, recovery, owner), copy the phone number id and token into
config, and point the WhatsApp webhook at t01. Approval takes days, so start here.

## Node-by-node visual verification

Work top to bottom in the node list; click each node and check the Fields panel.

- WhatsApp intake, Web form intake: httpMethod POST, path matches your token,
  responseMode onReceived. The URLs in the Webhook URLs tab are what you put
  in Meta and in the booking form.
- Email intake (placeholder): the node is disabled (greyed). Leave it
  disabled until the email question is answered.
- Reminder sweep, No-show sweep: crons show `0 * * * *` (plus `0 9 * * *` on No-show); they run in the instance timezone.
- Normalize intake, Parse request, Resolve slot, Dedupe filter, Parse slot
  choice, Select old row, Find due bookings, Find passed events: JavaScript
  code present, no red error banner, all tokens inside code match the value
  table.
- Route reply type: five rules (new_booking, slot_choice_button,
  slot_choice_digit, cancel, reschedule). Post-slot router: four rules.
- Normalize intake: button replies are matched by id or title
  (case-insensitive), so the template buttons can use human-readable labels
  (Reschedule, Cancel); SLOT_ ids remain the callback format for slot offers.
- Check availability, Create event, Cancel event, Check attendance, Next free
  slots, Recompute slots, Reschedule slots, Next recovery slots: operation
  selected, calendar id token filled, retryOnFail 3 on create and check.
- Slot buttons, Reschedule buttons, Send recovery slots: POST to the Graph
  API messages url with {{CONFIG.whatsapp_api_version}} and
  {{CONFIG.whatsapp_phone_number_id}}, Authorization Bearer
  {{CONFIG.whatsapp_token}}, interactive button JSON body, onError continue.
- Read bookings sheet, Read bookings for reminders, Read bookings for
  no-show: full reads, no filter. Log booking, all Mark/update nodes:
  spreadsheet id token, sheet name token, operation correct.
- Read booking row, Read customer rows, Read old row: filter set to phone or
  booking id, not a full read.
- Confirm, Send reminder 24h, Send reminder 2h, Recovery, all fallback text
  nodes: from number token, template or text correct.
- Slack notify new booking, Slack notify recovery rebook, Slack reminder
  alert, Slack alert: channel tokens filled, text includes the right fields.
- Notify new booking?, Notify recovery rebook?, Reminder alert?, Alert?: if gates comparing {{CONFIG.slack_enabled}} to "true" (plain string).
- Owner notify new booking, Owner notify recovery rebook, Owner reminder alert, Owner alert: WhatsApp template to {{CONFIG.owner_whatsapp_number}} with {{CONFIG.whatsapp_template_owner}}.
- All noOp nodes: nothing to configure, connected inputs only.

After checking, enable the workflow and confirm the canvas shows no red warnings on any node.

## Manual dry-run

Execute one node at a time in this order, using the Execute Node button on each node.

1. WhatsApp intake: send "Book a haircut tomorrow at 4 PM" to the business
   number; expect one execution with the raw Meta payload.
2. Normalize intake: expect one item with action new_booking, name, phone,
   service, raw_text.
3. Parse request: expect service Haircut, requested date and time filled,
   parseable true.
4. Resolve slot: expect booking_id, start_at and end_at in your timezone,
   valid true.
5. Read bookings sheet: expect the sheet rows, or an empty array on first run.
6. Check availability: expect a free/busy response with an empty busy list for
   a free slot.
7. Create event: expect the event object with your summary and description.
8. Log booking: expect the appended row with status confirmed.
9. Confirm: expect the WhatsApp confirmation with Reschedule and Cancel
   buttons. For a busy slot, Slot buttons sends alternatives as interactive
   buttons; on failure the fallback text arrives and the customer replies
   1, 2 or 3.
10. Slack notify new booking: expect the Slack post (or the owner WhatsApp note when slack_enabled is false).
11. Reminder sweep: with a booking 25 hours out, run Find due bookings; expect
    one item tagged 24h. Run Send reminder 24h; expect the message.
12. No-show sweep: mark an old event unattended, run Find passed events, then
    Mark no_show, Next recovery slots, Recovery, Send recovery slots; expect
    the recovery message and slot buttons, or the fallback text.
13. Error trigger: with a wrong calendar credential, trigger the workflow;
    expect the Alert? gate to route to Slack alert or Owner alert.

## Canvas basics

- Pan: hold space and drag, or drag the empty canvas.
- Zoom: scroll wheel, or the + and - buttons bottom right.
- Execute: select a node and press Execute Node, or Execute Workflow for the
  whole flow from a trigger.
- View executions: open the Executions tab in the left sidebar; each run
  shows input and output per node.
- Enable or disable a node: select it, open the node settings (gear), toggle
  Active.

## Common gotchas

Read `blueprints/BUGS-AND-QUIRKS.md` for the full log. For this service:

- Node typeVersions matter: this prototype uses current versions (webhook
  2.1, googleSheets 4.7, googleCalendar 1.3, scheduleTrigger 1.3, slack 2.7).
  On older n8n, accept import updates and re-check affected parameters.
- WhatsApp templates must be approved before template sends work; until then
  the fallback text nodes carry the messages, and they are plain text, which
  Meta allows for reply messages only. Test with a real customer number.
- The n8n WhatsApp node cannot send interactive buttons; slot offers go
  through HTTP Request nodes to the Graph API. A wrong
  {{CONFIG.whatsapp_token}} falls back to numbered text plus digit reply;
  test the token before enabling.
- WhatsApp Manager template quick-reply buttons have no payload field; n01
  matches by id or title (case-insensitive), so labels stay human-readable
  (Reschedule, Cancel).
- {{CONFIG.slack_enabled}} is a plain string compare ("true" or "false");
  the four team alert gates route to Slack or to the owner WhatsApp template.
  Submit booking_owner_notify as a fourth template (Utility, en_US) with body
  "{{1}}: {{2}} at {{3}} for {{4}}. Phone: {{5}}".
- The 09:00 no-show catch-up is a second cron in the same No-show sweep
  trigger; if you see two rules there, that is correct.
- Calendar timezone: if events land at the wrong hour, check the instance timezone is {{CONFIG.timezone}} (schedule triggers use it) and the Code nodes.
- Do not delete the disabled Email intake node; it is the documented
  extension point for email intake.

## Readiness

The blueprint is v1.0-ready only when the stress-test matrix in design
section 10 passes end to end; until then it is v0.1 and should run in a
test calendar and a test sheet.
