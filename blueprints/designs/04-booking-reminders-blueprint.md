# Bookings and No-Show Recovery: n8n Blueprint

## 1. Header

| Field | Value |
| --- | --- |
| Service title | Bookings and no-show recovery |
| Spec sheet | specs/04-booking-reminders.md (v0.2, 2026-08-11) |
| Blueprint version | v0.1 |
| Date | 2026-08-11 |
| Author | Nexus Automations, n8n automation architect |

## 2. Summary

This automation turns a booking request from WhatsApp, web form or email into a confirmed Google Calendar event, then confirms it and sends 24-hour and 2-hour reminders on the customer's preferred channel. If the customer never shows up, a sweep detects the missed slot and sends an instant rebooking offer with free slots as quick replies. The team is notified on Slack for every new booking and every recovery rebooking, and the whole service runs on a self-hosted n8n instance for $8 to $31 per month at 500 bookings.

## 3. Architecture overview

The service is split into four n8n workflows so each trigger runs independently: Workflow A "Booking intake" (WhatsApp webhook, web form webhook, optional email IMAP), Workflow B "Reminder sweep" (hourly), Workflow C "No-show sweep" (hourly plus a 09:00 daily catch-up), and Workflow D "Error alerting", registered as the error workflow for A, B and C. Intake normalizes every channel into one canonical payload, parses free text with regex, resolves the slot in the client timezone, dedupes, checks availability, creates the calendar event, logs the row, sends the confirmation and notifies Slack. All quick replies (slot choice, cancel, reschedule) come back through the WhatsApp webhook and are routed by one Switch node. Reminder and no-show sweeps read the bookings sheet, key every update by event_id and booking_id so re-runs never double-send, and every client-specific value lives in a `{{CONFIG.x}}` token.

```
Workflow A: Booking intake
  n01 WhatsApp webhook ─┐
  n02 Web form webhook ─┼─> n04 Route reply type ─> new booking ─> n05 Parse request ─> n06 parseable?
  n03 Email IMAP ───────┘        │ slot_choice            (cancel)  │ false            │ true
                                  │  └> n24 Parse slot choice        └> n07 Guided      n08 Resolve slot
                                  │     └> reuse n13 to n23           prompt (reply     └> n09 Dedupe ─> n10 Duplicate?
                                  └> reschedule └> n31 Cancel old     loops back        true ─> n11 Already booked
                                     event path                       via n01)          false ─> n13 Check availability ─> n14
                                                                                          busy ─> n15 Next slots ─> n16 Alternatives
                                                                                          free ─> n18 Create event ─> n19 Log
                                                                                                 └> n20 Confirm ─> n22 Slack

Workflow B: Reminders (hourly)          Workflow C: No-show (hourly + 09:00)      Workflow D: Errors
  n34 sweep ─> n35 find due ─> n36 window   n47 sweep ─> n48 find passed ─> n49 check attendance
  └> n37/n39 send ─> n41 mark reminded      attended ─> n55 close
  failure ─> n42 mark failed ─> n43 retries no_show ─> n51 mark ─> n52 recovery          n56 Error trigger ─> n57 Slack alert
                                   └> n44 alert      customer picks slot ─> back to n24, reuses intake path
```

## 4. Node inventory

| Node id | Node name | n8n type | typeVersion | Purpose | Key parameters |
| --- | --- | --- | --- | --- | --- |
| n01 | WhatsApp intake | n8n-nodes-base.webhook | 2 | Trigger for WhatsApp Cloud API messages | POST, path {{CONFIG.webhook_path_whatsapp}}, respond 200; reads `from`, `text.body`, `interactive.button_reply`, `contacts[0].profile.name` |
| n02 | Web form intake | n8n-nodes-base.webhook | 2 | Trigger for the booking web form | POST, path {{CONFIG.webhook_path_form}}, JSON body `{name, phone, service, date, time, notes, source}` |
| n03 | Email intake | n8n-nodes-base.emailReadImap | 2 | Optional email trigger (see Open questions) | Poll every 5 min, folder {{CONFIG.email_intake_folder}}, credential {{CONFIG.email_imap_credential}}, mark seen after process |
| n04 | Route reply type | n8n-nodes-base.switch | 3 | Route WhatsApp quick replies and free text | Rules on `interactive.button_reply.id` prefix: `SLOT_` to slot choice, `CANCEL_` to cancel, `RESCHED_` to reschedule, no reply id to new booking |
| n05 | Parse request | n8n-nodes-base.code | 2 | Extract name, phone, service, date, time from free text | Regex for "today", "tomorrow", weekday names, HH:MM, service keywords from {{CONFIG.services}}; ES2022 JS |
| n06 | Request parseable? | n8n-nodes-base.if | 2 | Gate on parse success | Condition: parsed date, time and service all present |
| n07 | Guided prompt | n8n-nodes-base.whatsApp | 2 | Ask for the missing booking fields | Text: "Which service, which day, what time? Example: Book a haircut tomorrow at 4 PM." Reply loops back through n01 |
| n08 | Resolve slot | n8n-nodes-base.code | 2 | Compute start and end ISO in client timezone | Luxon with {{CONFIG.timezone}}; duration from {{CONFIG.services}}; reject outside {{CONFIG.business_hours}}; booking_id = {{CONFIG.booking_id_prefix}} + phone last 4 + start epoch seconds |
| n09 | Dedupe check | n8n-nodes-base.googleSheets | 4 | Find a recent identical booking | Read {{CONFIG.bookings_sheet_name}}, filter phone + service + start_at within {{CONFIG.dedupe_window_minutes}} minutes |
| n10 | Duplicate intake? | n8n-nodes-base.if | 2 | Gate on duplicate match | Condition: match count = 0 |
| n11 | Already booked | n8n-nodes-base.whatsApp | 2 | Tell the customer a booking exists | Text: "You already have this booking. Reply Cancel to change it." |
| n12 | Done duplicate | n8n-nodes-base.noOp | 1 | Terminal for the duplicate branch | none |
| n13 | Check availability | n8n-nodes-base.googleCalendar | 3 | Free/busy query for the resolved slot | Operation freeBusy, calendars {{CONFIG.calendar_ids}}, retryOnFail 3 with backoff 1s, 5s, 30s; runs immediately before create (race re-check) |
| n14 | Slot available? | n8n-nodes-base.if | 2 | Gate on free/busy result | Condition: busy list empty for the slot window |
| n15 | Next free slots | n8n-nodes-base.googleCalendar | 3 | Scan the next free slots | freeBusy over {{CONFIG.recovery_slot_count}} slots at {{CONFIG.slot_step_minutes}} minute steps inside {{CONFIG.business_hours}} |
| n16 | Slot alternatives | n8n-nodes-base.whatsApp | 2 | Offer the next free slots | Text with quick replies `SLOT_<iso>_<booking_id>` per free slot |
| n17 | Done alternatives | n8n-nodes-base.noOp | 1 | Terminal for the alternatives branch | none |
| n18 | Create event | n8n-nodes-base.googleCalendar | 3 | Insert the calendar event | Operation event create, calendar {{CONFIG.calendar_ids}}, summary "{{CONFIG.client_name}} - Service", description with phone, notes and attendance marker note, attendees empty |
| n19 | Log booking | n8n-nodes-base.googleSheets | 4 | Append the booking row | Append to {{CONFIG.bookings_sheet_name}}, status confirmed, columns per section 6 |
| n20 | Confirm | n8n-nodes-base.whatsApp | 2 | Send confirmation with quick replies | Template {{CONFIG.whatsapp_template_confirm}}, body with service, time, {{CONFIG.location_text}}; buttons `RESCHED_<booking_id>`, `CANCEL_<booking_id>`; error branch to n21 |
| n21 | Confirm fallback text | n8n-nodes-base.whatsApp | 2 | Plain text confirmation on template rejection | Text mirroring the template body, sent from {{CONFIG.whatsapp_business_number}} |
| n22 | Notify new booking | n8n-nodes-base.slack | 2 | Post to the bookings channel | Channel #{{CONFIG.slack_bookings_channel}}, message with customer, service, start_at, source |
| n23 | Done booking | n8n-nodes-base.noOp | 1 | Terminal for the booking branch | none |
| n24 | Parse slot choice | n8n-nodes-base.code | 2 | Extract chosen slot and booking id from a callback | Parse `SLOT_<iso>_<booking_id>`; set context flag: alternative, recovery or reschedule |
| n25 | Update recovery row | n8n-nodes-base.googleSheets | 4 | Reuse booking_id with a new status | Update row by booking_id: status rescheduled, new event_id, start_at, end_at |
| n26 | Notify recovery rebook | n8n-nodes-base.slack | 2 | Alert on a no-show recovery click | Channel #{{CONFIG.slack_bookings_channel}}, message "Recovery rebooking for booking <id>" |
| n27 | Cancel event | n8n-nodes-base.googleCalendar | 3 | Delete the calendar event | Operation event delete by event_id from `CANCEL_<booking_id>` lookup; only when row status is confirmed or reminded |
| n28 | Mark cancelled | n8n-nodes-base.googleSheets | 4 | Update row status | Update by booking_id, status cancelled |
| n29 | Cancelled reply | n8n-nodes-base.whatsApp | 2 | Confirm the cancellation | Text: "Booking cancelled. Book again anytime." |
| n30 | Done cancel | n8n-nodes-base.noOp | 1 | Terminal for the cancel branch | none |
| n31 | Cancel old event | n8n-nodes-base.googleCalendar | 3 | Delete the old event after a reschedule is confirmed | Event delete by old event_id; runs after the new event is created and logged |
| n32 | Mark old row cancelled | n8n-nodes-base.googleSheets | 4 | Old row to cancelled | Update by booking_id, status cancelled, note "rescheduled" |
| n33 | Done reschedule | n8n-nodes-base.noOp | 1 | Terminal for the reschedule branch | none |
| n34 | Reminder sweep | n8n-nodes-base.scheduleTrigger | 1.2 | Hourly reminder trigger | Cron `0 * * * *`, timezone {{CONFIG.timezone}} |
| n35 | Find due bookings | n8n-nodes-base.googleSheets | 4 | Rows starting inside a reminder window | Read sheet, filter status in (confirmed, reminder_failed) AND reminder_attempts < {{CONFIG.max_reminder_attempts}} AND start_at between now + {{CONFIG.reminder_lead_2h}} and now + {{CONFIG.reminder_lead_24h}} |
| n36 | Reminder window? | n8n-nodes-base.if | 2 | Pick the 24h or 2h template | Condition: start_at <= now + {{CONFIG.reminder_lead_24h}} (24h branch) else 2h branch |
| n37 | Send reminder 24h | n8n-nodes-base.whatsApp | 2 | 24-hour reminder | Template {{CONFIG.whatsapp_template_reminder}} with booking time; error branch to n38 |
| n38 | Reminder 24h fallback text | n8n-nodes-base.whatsApp | 2 | Plain text 24h reminder | Text mirroring the template, from {{CONFIG.whatsapp_business_number}}; error branch to n42 |
| n39 | Send reminder 2h | n8n-nodes-base.whatsApp | 2 | 2-hour reminder | Template {{CONFIG.whatsapp_template_reminder}} with booking time; error branch to n40 |
| n40 | Reminder 2h fallback text | n8n-nodes-base.whatsApp | 2 | Plain text 2h reminder | Text mirroring the template, from {{CONFIG.whatsapp_business_number}}; error branch to n42 |
| n41 | Mark reminded | n8n-nodes-base.googleSheets | 4 | Status to reminded | Update by event_id, status reminded |
| n42 | Mark reminder failed | n8n-nodes-base.googleSheets | 4 | Record the failed attempt | Update by event_id, status reminder_failed, reminder_attempts + 1 |
| n43 | Reminder retries left? | n8n-nodes-base.if | 2 | Check the attempt counter | Condition: reminder_attempts < {{CONFIG.max_reminder_attempts}}; true to n45, false to n44 |
| n44 | Reminder alert | n8n-nodes-base.slack | 2 | Alert after max attempts | Channel #{{CONFIG.slack_alerts_channel}}, message with booking_id, event_id, attempts |
| n45 | Reminder done | n8n-nodes-base.noOp | 1 | Terminal, retry at the next sweep | none |
| n46 | Reminder gave up | n8n-nodes-base.noOp | 1 | Terminal after the alert | none |
| n47 | No-show sweep | n8n-nodes-base.scheduleTrigger | 1.2 | Hourly no-show trigger plus catch-up | Crons `0 * * * *` and `0 9 * * *`, timezone {{CONFIG.timezone}} |
| n48 | Find passed events | n8n-nodes-base.googleSheets | 4 | Events past their slot | Filter status in (confirmed, reminded) AND start_at < now - {{CONFIG.no_show_grace_minutes}} |
| n49 | Check attendance | n8n-nodes-base.googleCalendar | 3 | Look for the manual attendance marker | Event get by event_id, check description contains {{CONFIG.attendance_marker}} (human-in-the-loop, see section 5) |
| n50 | Attended? | n8n-nodes-base.if | 2 | Gate on the marker | Condition: marker present; true to n55, false to n51 |
| n51 | Mark no_show | n8n-nodes-base.googleSheets | 4 | Status to no_show before recovery | Update by booking_id, status no_show (prevents sweep re-pick) |
| n52 | Recovery | n8n-nodes-base.whatsApp | 2 | Recovery message with slot options | Template {{CONFIG.whatsapp_template_recovery}}, quick replies `SLOT_<iso>_<booking_id>` for {{CONFIG.recovery_slot_count}} slots; error branch to n53 |
| n53 | Recovery fallback text | n8n-nodes-base.whatsApp | 2 | Plain text recovery message | Text mirroring the template with slot options, from {{CONFIG.whatsapp_business_number}} |
| n54 | Done no-show | n8n-nodes-base.noOp | 1 | Terminal after recovery send | none |
| n55 | Close event | n8n-nodes-base.noOp | 1 | Terminal for the attended branch | none |
| n56 | Error | n8n-nodes-base.errorTrigger | 1 | Catch workflow errors | Registered as error workflow for A, B and C |
| n57 | Alert | n8n-nodes-base.slack | 2 | Post to the alerts channel | Channel #{{CONFIG.slack_alerts_channel}}, message with workflow, node, error message |

## 5. End-to-end flow narrative

Intake. A WhatsApp message arrives at n01, a web form POST at n02, or an email at n03. n04 inspects the WhatsApp payload: a `button_reply.id` starting with `SLOT_` routes to the slot choice path (n24), `CANCEL_` to the cancel path (n27), `RESCHED_` to the reschedule path (n31), and anything else is treated as a new booking request. Form and email payloads skip n04 and go straight to n05.

New booking. n05 normalizes the payload and parses free text with regex: "today", "tomorrow", weekday names, HH:MM and service keywords from the config service list. If any field is missing or unparseable, n06 sends the customer to n07, the guided prompt ("Which service, which day, what time?"), and the conversation stays in the intake stage: the customer's next message comes back through n01 and n04 as a new booking attempt. This loop replaces the Wait-based follow-up chain from the reference demo, because WhatsApp Cloud replies arrive as webhook events anyway; the Wait pattern is not needed and would only delay the reply.

On a successful parse, n08 converts the request to concrete start and end ISO timestamps with Luxon in {{CONFIG.timezone}}, validates against {{CONFIG.business_hours}}, looks up the service duration from {{CONFIG.services}}, and generates a deterministic booking_id (prefix + phone last 4 + start epoch), so the id is stable across retries. n09 reads the bookings sheet for an identical row (same phone, service and start_at within the last {{CONFIG.dedupe_window_minutes}} minutes). n10 routes duplicates to n11 ("You already have this booking") and n12. Otherwise n13 runs a free/busy query for the slot. Because n13 sits immediately before event creation, it doubles as the re-check that closes the double-booking race.

If the slot is busy, n14 sends the request to n15, which scans the next free slots at {{CONFIG.slot_step_minutes}} minute steps inside business hours, and n16 offers them as quick replies carrying `SLOT_<iso>_<booking_id>`. If the customer picks one, the reply returns to n01, n04 routes it to n24, and the availability and creation steps (n13 to n23) run again for the new slot.

If the slot is free, n18 creates the event with summary "{{CONFIG.client_name}} - Service" and a description containing the phone, notes and a marker line (see attendance below). n19 appends the row to the bookings sheet with status confirmed. n20 sends the confirmation template with the service, time, {{CONFIG.location_text}} and the Reschedule and Cancel quick replies; on template rejection it falls back to plain text via n21. n22 posts to Slack #bookings and n23 closes the branch.

Cancel. A `CANCEL_<booking_id>` reply routes to n27, which deletes the calendar event only if the row status is still confirmed or reminded (a status transition check that handles the cancel-while-confirming race). n28 marks the row cancelled, n29 confirms to the customer, n30 closes.

Reschedule. A `RESCHED_<booking_id>` reply routes to n15, which offers the next free slots with the booking id in the callback. When the customer picks one, n24 parses it, n13 to n23 run with the same booking_id, n19 logs a new row with status rescheduled, then n31 deletes the old event and n32 marks the old row cancelled. This keeps one booking_id per customer intent, as required by the idempotency rules.

Reminders. n34 fires every hour. n35 reads rows whose start_at falls inside the reminder windows (now + {{CONFIG.reminder_lead_2h}} to now + {{CONFIG.reminder_lead_24h}}) with status confirmed or reminder_failed and attempts below the max. n36 picks the 24h or 2h template; n37 and n39 send it, each falling back to plain text (n38, n40) on template rejection. Success reaches n41 and marks the row reminded. Any remaining failure reaches n42, which sets status reminder_failed and increments the attempt counter; n43 then alerts on Slack (n44) once attempts hit the max, or lets the next hourly sweep retry (n45).

No-show recovery. n47 fires hourly plus a 09:00 catch-up. n48 reads rows whose start_at is more than {{CONFIG.no_show_grace_minutes}} minutes in the past with status confirmed or reminded. For each row, n49 fetches the calendar event and checks for the attendance marker. This is the main human-in-the-loop point: the team marks attendance manually by appending {{CONFIG.attendance_marker}} to the event description in Google Calendar (a one-tap edit at the desk). If the marker exists, n50 closes the event (n55). If not, n51 marks the row no_show first (so the sweep cannot re-pick it), then n52 sends the recovery message "We missed you today. Want to rebook now?" with the next free slots as quick replies, falling back to plain text (n53) on template rejection, and n54 closes. A customer slot pick returns through n01 and n04 to n24, reuses the intake path with the same booking_id, and n26 posts the recovery rebooking to Slack.

Error path. Any unhandled error in workflows A, B or C fires n56, and n57 posts the workflow name, node and error to #{{CONFIG.slack_alerts_channel}}. Calendar and WhatsApp node calls additionally retry 3 times with 1s, 5s and 30s backoff before the error workflow sees them.

## 6. Data model

Canonical intake payload (n05 output):

```json
{
  "action": "new_booking",
  "name": "Ravi Das",
  "phone": "88017XXXXXXXX",
  "service": "Haircut",
  "requested_date": "2026-08-12",
  "requested_time": "16:00",
  "raw_text": "Book a haircut tomorrow at 4 PM",
  "source": "whatsapp",
  "booking_id": ""
}
```

Web form payload (n02 input, from the sheet):

```json
{ "name": "Ravi Das", "phone": "88017XXXXXXXX", "service": "Haircut", "date": "2026-08-12", "time": "16:00", "notes": "", "source": "instagram" }
```

Resolved booking payload (n08 output):

```json
{
  "booking_id": "BK-4821-2593721",
  "customer_name": "Ravi Das",
  "phone": "88017XXXXXXXX",
  "service": "Haircut",
  "start_at": "2026-08-12T16:00+06:00",
  "end_at": "2026-08-12T17:00+06:00",
  "duration_minutes": 60,
  "source": "whatsapp",
  "status": "confirmed"
}
```

WhatsApp callback id formats (n04 routing keys):

```
SLOT_<iso>_<booking_id>     slot choice (alternatives, recovery, reschedule)
CANCEL_<booking_id>         cancel
RESCHED_<booking_id>        reschedule
```

Bookings sheet row, sheet {{CONFIG.bookings_sheet_name}}:

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| booking_id | string | BK-1001 | generated once, reused for all follow-ups |
| event_id | string | 7m2k9q... | Google Calendar event id, update key |
| customer_name | string | Ravi Das | |
| phone | string | 88017XXXXXXXX | |
| service | string | Haircut | |
| start_at | datetime | 2026-08-12T16:00+06:00 | client timezone |
| end_at | datetime | 2026-08-12T17:00+06:00 | duration from config |
| status | string | confirmed | confirmed, reminded, attended, no_show, rescheduled, cancelled, reminder_failed |
| source | string | whatsapp | whatsapp, web, email |
| reminder_attempts | number | 0 | extension column, not in the sheet table, see changelog |
| created_at | timestamp | 2026-08-11T10:05+06:00 | |

Storage layout. Google Calendar is the source of truth for events (summary "{{CONFIG.client_name}} - Service", description holds phone, notes and the attendance marker line, attendees empty). Google Sheets holds the log in a tab named {{CONFIG.bookings_sheet_name}} (clientname_bookings by convention). Slack channels #{{CONFIG.slack_bookings_channel}} for business events and #{{CONFIG.slack_alerts_channel}} for operational alerts.

## 7. Per-client config extraction

| Config token | Description | Sheet section 8 item |
| --- | --- | --- |
| {{CONFIG.google_calendar_credential}} | n8n credential name for the Google Calendar service account or OAuth | 1 |
| {{CONFIG.calendar_ids}} | Calendar id(s) for availability and event creation | 2 |
| {{CONFIG.services}} | Map of service names to duration_minutes and price | 3 |
| {{CONFIG.business_hours}} | Open and close times and working days | 4 |
| {{CONFIG.timezone}} | IANA timezone, e.g. Asia/Dhaka | 4 |
| {{CONFIG.whatsapp_credential}} | WhatsApp Cloud API credential in n8n | 5 |
| {{CONFIG.whatsapp_business_number}} | Business WhatsApp number | 5 |
| {{CONFIG.whatsapp_template_confirm}} | Approved confirmation template id | 5 |
| {{CONFIG.whatsapp_template_reminder}} | Approved reminder template id | 5 |
| {{CONFIG.whatsapp_template_recovery}} | Approved recovery template id | 5 |
| {{CONFIG.webhook_path_form}} | n8n webhook path for the booking form | 6 |
| {{CONFIG.webhook_path_whatsapp}} | n8n webhook path for WhatsApp, registered in Meta | 6 (derived) |
| {{CONFIG.sheets_spreadsheet_id}} | Google Sheets spreadsheet id | 7 |
| {{CONFIG.bookings_sheet_name}} | Sheet tab name, clientname_bookings | 7 |
| {{CONFIG.slack_credential}} | Slack credential (app or incoming webhook) | 8 |
| {{CONFIG.slack_bookings_channel}} | #bookings channel name | 8 |
| {{CONFIG.slack_alerts_channel}} | #alerts channel name | 8 (derived, sheet 6.5) |
| {{CONFIG.reminder_lead_24h}} | 24-hour reminder lead, default 24 | 9 |
| {{CONFIG.reminder_lead_2h}} | 2-hour reminder lead, default 2 | 9 |
| {{CONFIG.no_show_grace_minutes}} | No-show window after start, default 30 | 10 |
| {{CONFIG.location_text}} | Branch address or location text for the confirmation | 11 |
| {{CONFIG.client_name}} | Client display name, prefixes calendar summary and Slack text | 11 (derived) |
| {{CONFIG.booking_id_prefix}} | Booking id prefix, e.g. BK | 7 example (derived) |
| {{CONFIG.dedupe_window_minutes}} | Dedupe window, default 10 | sheet 6.4 (derived) |
| {{CONFIG.max_reminder_attempts}} | Max reminder attempts, default 3 | sheet 6.5 (derived) |
| {{CONFIG.recovery_slot_count}} | Slots offered in alternatives and recovery, default 3 | sheet 6.1 (derived) |
| {{CONFIG.slot_step_minutes}} | Availability scan step, default 30 | build detail (derived) |
| {{CONFIG.attendance_marker}} | String the team appends to the event description to mark attendance | sheet 6.2 (derived) |
| {{CONFIG.email_imap_credential}} | IMAP credential if email intake is enabled | sheet 4.1 (derived) |
| {{CONFIG.email_intake_folder}} | IMAP folder to poll, default INBOX | sheet 4.1 (derived) |

## 8. Error handling and resilience

Retry policy. Google Calendar and WhatsApp node calls set retryOnFail to 3 with exponential backoff (1s, 5s, 30s) at node level. Reminder sends are retried on the next hourly sweep up to {{CONFIG.max_reminder_attempts}} times, then alert. Calendar failures never confirm a booking: availability is a hard gate before event creation.

Timeout strategy. Webhook executions run synchronously with a 30 second connection timeout on HTTP calls; no long Wait nodes are used anywhere. Sweeps are asynchronous scheduled runs, so they can take minutes without affecting the customer.

Idempotency keys. booking_id is generated deterministically in n08 and reused for all reminders, cancels and rebookings. Reminder and no-show updates are keyed by event_id or booking_id, so a re-run of a sweep cannot double-send or double-update. The dedupe check in n09 suppresses duplicate intake on (phone + start ISO + service) within {{CONFIG.dedupe_window_minutes}} minutes. The no-show sweep marks the row no_show before sending, so it can never re-pick the same event.

External API down. Google Calendar down: availability fails safe, the customer is never confirmed into an unknown slot, node retries run, and the error workflow alerts on Slack. WhatsApp down: sends fail, reminders are retried by the next sweep, and the error workflow alerts. Slack down: n22, n26 and n44 set "continue on regular output", so a Slack outage is log-only and never blocks the booking flow (sheet failure mode 8). Sheets down: the intake flow stops with an alert; no event is created without a log row, keeping calendar and sheet consistent.

Double-booking race. Availability is re-checked immediately before create (n13 right before n18); on conflict the customer is offered the next free slots.

Template rejection. Every business-initiated WhatsApp message uses an approved template; on a 403 or template error the sender falls back to a plain text message from the business number (n21, n38, n40, n53).

## 9. Failure-mode mapping

| Sheet failure mode | Where the blueprint handles it |
| --- | --- |
| Calendar API outage (5xx on availability) | n13 retries 3x with backoff, n14 never confirms blindly; n56 to n57 alert on Slack; n07 style message keeps the customer informed |
| Invalid date/time input (parse fails) | n06 false branch sends n07 guided prompt with a valid example; customer stays in intake |
| Double-booking race (two intake flows, same slot) | n09 dedupe window plus n13 re-check immediately before n18; n14 offers alternatives via n15 and n16 |
| Reminder not sent (status stuck at confirmed) | n42 marks reminder_failed and increments attempts; n35 re-picks the row next sweep; n43 to n44 alert after {{CONFIG.max_reminder_attempts}} failures |
| WhatsApp template not approved (send 403) | error branch of n20, n37, n39 and n52 to plain text fallbacks n21, n38, n40 and n53 |
| Timezone mismatch (event at wrong hour) | every datetime conversion runs through Luxon with {{CONFIG.timezone}} in n08, n35 and n48 |
| Cancel/reschedule race (cancel while confirming) | n27 deletes the event only when row status is confirmed or reminded; quick-reply routing keeps the state transition single-threaded |
| Slack notify failure (5xx) | n22, n26 and n44 set continue-on-fail; log-only, no impact on the booking flow |

## 10. Stress-test plan

| # | Scenario | Test input | Expected output | Pass condition |
| --- | --- | --- | --- | --- |
| 1 | Happy path booking | WhatsApp "Book a haircut tomorrow at 4 PM" | Event created, confirmation sent, sheet row logged | Calendar event exists with summary "{{CONFIG.client_name}} - Haircut"; sheet row status confirmed; n22 Slack post received |
| 2 | Slot unavailable | Request a slot already booked in the calendar | Reply offers the next 3 free slots, no event created | n16 message contains 3 slot quick replies; no new calendar event; no new confirmed row |
| 3 | Malformed date | "Book haircut sometime" | Guided prompt reply, no crash | n07 message sent; no event created; error workflow silent |
| 4 | Duplicate intake | Same request twice within 10 minutes | One booking, one event | One sheet row, one calendar event, one confirmation message |
| 5 | Concurrent same-slot | 5 simultaneous requests for one slot | Exactly one event created, others get alternatives | Calendar contains exactly one event for the slot; 4 customers received n16 alternatives |
| 6 | 10x volume | 100 booking requests in one hour | All resolved, no double-booking | All 100 requests terminal; p95 under 20s per webhook execution; no duplicate events; no failed rows |
| 7 | Simulated calendar outage | Invalid calendar credentials | Availability fails safe, no confirmation, Slack alert | No event created; n57 alert in #{{CONFIG.slack_alerts_channel}}; customer not confirmed |
| 8 | Reminder timing | Book an event 25h out, run sweeps | Reminders at 24h and 2h, status reminded, no duplicates | Two messages sent at the correct windows; row status reminded; re-running the sweep sends nothing new |
| 9 | No-show recovery | Mark event unattended after start | Recovery message sent, rebooking reuses booking_id | Recovery message received; slot pick produces a new event and row with the same booking_id and status rescheduled; n26 Slack post received |

## 11. Deployment steps

1. Provision a VPS: Hetzner CX22 tier ($3 to $6/month) or Oracle Cloud Always Free, Ubuntu 22.04 or newer.
2. Install Docker and Docker Compose, then run the official n8n image (`docker.n8n.io/n8nio/n8n`) with a named volume for data, or the n8n install script on the free tier.
3. Create the n8n credentials: Google Calendar OAuth (or service account), Google Sheets (same Google account), WhatsApp Cloud API, Slack (app with webhooks), IMAP (only if email intake is enabled).
4. Create the Meta WhatsApp app, add the business number, and submit the three templates for approval: confirmation (with buttons Reschedule and Cancel), reminder, recovery (with slot quick replies). Approval takes days, start first.
5. Create the spreadsheet with a tab named {{CONFIG.bookings_sheet_name}} and the column headers from section 6.
6. Fill every token from section 7 into the config source (n8n variables or a per-client config JSON in the Code nodes). No real value may appear in node parameters.
7. Import the four workflow JSONs (intake, reminder sweep, no-show sweep, error alerting) and register the error workflow on workflows A, B and C.
8. Set the timezone {{CONFIG.timezone}} on every Schedule Trigger and on the n8n instance settings.
9. Copy the webhook URLs for n01 and n02 into the Meta app (WhatsApp webhook) and the booking form; verify the handshake challenge.
10. Run the validation checklist below, then the stress-test plan in section 10.

## 12. Validation checklist

- [ ] All four workflows imported and enabled; no red nodes in the editor
- [ ] Credentials named exactly as in the config tokens and connected to their nodes
- [ ] Templates confirmed approved in Meta; template ids in config match
- [ ] Calendar free/busy returns the correct busy blocks for a known booked slot
- [ ] A test event created by n18 appears with the right summary, timezone and no attendees
- [ ] Sheet headers match section 6 exactly, including reminder_attempts
- [ ] Every node parameter contains only {{CONFIG.x}} tokens or workflow expressions, no real client values
- [ ] Cron values and timezone verified against {{CONFIG.timezone}} on n34 and n47
- [ ] Webhook handshake works for both n01 and n02; form POST returns 200
- [ ] Slack posts appear in #{{CONFIG.slack_bookings_channel}} and alerts go to #{{CONFIG.slack_alerts_channel}}
- [ ] A forced error (wrong calendar credential) produces an n57 alert and no customer message
- [ ] n8n node typeVersions match the installed n8n version (verify during import)
- [ ] The reference demo pattern (quick-reply buttons, free-text intake) is reused; no Wait nodes in the flow

## 13. Open questions

1. Email intake: the sheet lists email in scope (section 4.1) but section 5 defines no email trigger, no IMAP details, and the references list has no email node. The blueprint assumes an IMAP trigger (n03) with config tokens; confirm the mailbox approach or drop email from v0.1.
2. Two crons in sheet section 5 (`0 9 * * *` and `0 * * * *`). The blueprint maps the hourly cron to both sweeps and uses 09:00 as a daily catch-up on the no-show sweep. Confirm this reading.
3. Attendance marker: the team marks attendance manually in the calendar. The blueprint checks for {{CONFIG.attendance_marker}} in the event description; confirm this convention (e.g. append "[ATTENDED]") and that the team can do the one-tap edit at the desk.
4. Reschedule UX: the sheet says reschedule is a quick-reply option. The blueprint answers the Reschedule button with the next free slots as quick replies (no free-text rescheduling). Confirm this is acceptable for the client.
5. Parsing model: the sheet mandates regex parsing in Code nodes, so no DeepSeek call is used in v0.1. If clients want fuzzy parsing later, `deepseek-chat` is the drop-in replacement in n05; flag it as a versioned change.
6. reminder_attempts is an extra sheet column not listed in the sheet table, needed to enforce the max-attempts rule (sheet 6.5). Confirm the extension.
7. Sheet metrics say the no-show flow runs "after the appointment end" while section 6.1 and section 10 say 30 minutes after start_at. The blueprint uses {{CONFIG.no_show_grace_minutes}} = 30 after start_at. Confirm which window the client wants.
8. The services list carries a price but v0.1 has no payment (out of scope, sheet 4.2). Price is stored but unused; harmless, confirmed.

## 14. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial blueprint from sheet 04 (v0.2). Cost model ($8-31/month at 500 bookings) and failure modes unchanged from the sheet. Added reminder_attempts column (see Open questions 6). Replaced the demo's Wait-based follow-up with webhook reply routing (n04). Discovered and logged the spec filename typo in the prompt input block (BUGS-AND-QUIRKS.md entry 1). |
