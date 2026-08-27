> **Pivot 2026-08-27 superseded slice:** This design is superseded by `00-omni-chat-core` unified build (71 nodes). Retained for traceability; see `docs/specs/Omni-Unified-Spec.md`. Original content below.

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

This automation turns a booking request from WhatsApp, a web form or email into a confirmed Google Calendar event, then sends a confirmation and reminders 24 hours and 2 hours before the start time on the customer's channel. A no-show sweep detects missed slots after the grace window and sends an instant rebooking offer with free slots as quick replies. The team is notified on Slack (or by WhatsApp template to the owner when Slack is disabled) for every new booking and every recovery rebooking, and the whole service runs on one self-hosted n8n instance for $8 to $31 per month at 500 bookings.

## 3. Architecture overview

One importable n8n workflow holds every trigger and every branch so the prototype matches the single PROTOTYPE_PATH requirement of the blueprint prompt. Six trigger nodes start independent executions: two webhooks (WhatsApp and web form), an email IMAP trigger (disabled placeholder), two schedule triggers (reminder sweep hourly, no-show sweep hourly plus a 09:00 catch-up) and the error trigger. All WhatsApp quick replies (slot choice, cancel, reschedule) return through the WhatsApp webhook and are routed by one switch node; intake, cancel, reschedule and recovery branches all flow through the same availability, event creation, logging and confirmation chain, keyed by a deterministic booking_id and by event_id so re-runs never double-send. Every client-specific value is a `{{CONFIG.x}}` token, mapped to the sheet's section 8 in section 7 of this document.

```
t01 WhatsApp webhook ─┐
t02 Web form webhook ─┼─> n01 Normalize ─> n02 Route ─ new_booking ─> n03 Parse ─> n04 parseable?
t03 Email (disabled) ─┘                      │ slot_choice_button └> n27 Parse slot choice ────────> n28 Merge
                                              │ slot_choice_digit  └> n27a Read rows ─> n27b Resolve ctx ─> n27b2 found? ─ true ─> n27c Recompute ─ n27d Pick
                                              │                                                    └ false ─> n05 Guided prompt
                                              │ cancel ─┐
                                              └ resched ┼─> n29 Read by phone ─> n29b Select active ─> n29c Route ─ cancel ─> n30 Cancel chain
                                                         │                                              └ resched ─> n37 Slots ─> n38 Buttons ─> n39 | err ─> n38f text ─> n38p pending
                                                                                     n12 Dedupe ─> n13 dup? ─ true ─> n14 Already booked
                                                                                        false ─> n28 Merge <─ n27/n27d
t04 Reminder sweep ─> n49 Read ─> n50 Find due ─> n51 type? ─ 24h: n52/n53 ─┐
                                                     └ 2h: n54/n55 ────────┼─> n56/n57 Mark sent | n58 fail ─> n59 retry ─ n60 | n61a ? ─> n61 Slack / n61b Owner
t05 No-show sweep ─> n63 Read ─> n64 Find passed ─> n65 Attendance ─ true ─> n67 Close
                                                └ false ─> n68 Mark no_show ─> n69 Slots ─> n70 Recovery tpl ─(err)> n71 fallback
                                                                                        └> n70s Slot buttons ─(err)> n70f text ─> n70p pending
n28 ─> n16 Availability ─> n17 free? ─ true ─> n21 Create event ─> n22 Log ─> n23 Confirm ─(error)> n24 fallback
                        └ false ─> n18 Next slots ─> n19 Slot buttons ─> n20 | err ─> n19f text ─> n19p pending
                                                                    └> n48 Post-slot router ─ new ─> n25a ? ─> n25 Slack | n25b Owner ─> n26 Done
                                                                        ├ reschedule ─> n40..n44 (cancel old event)
                                                                        ├ recovery ─> n45a ? ─> n45 Slack | n45b Owner ─> n46 Done
                                                                        └ alternative ─> n47 Done
t06 Error trigger ─> n73a ? ─> n73 Slack | n73b Owner alert
```

## 4. Node inventory

Every node below exists in `blueprints/builds/04-booking-reminders-prototype.json` with the same id, name, type and typeVersion.

| Node id | Node name | n8n type | typeVersion | Purpose | Key parameters |
| --- | --- | --- | --- | --- | --- |
| t01 | WhatsApp intake | n8n-nodes-base.webhook | 2.1 | Trigger for WhatsApp Cloud API messages | POST, path {{CONFIG.webhook_path_whatsapp}}, responseMode onReceived |
| t02 | Web form intake | n8n-nodes-base.webhook | 2.1 | Trigger for the booking web form | POST, path {{CONFIG.webhook_path_form}}, JSON body per sheet section 5 |
| t03 | Email intake (placeholder) | n8n-nodes-base.emailReadImap | 2.2 | Disabled placeholder for email intake (see Open questions 1) | Poll every 5 min, folder {{CONFIG.email_intake_folder}}, credential {{CONFIG.email_imap_credential}} |
| t04 | Reminder sweep | n8n-nodes-base.scheduleTrigger | 1.3 | Hourly reminder trigger | Cron `0 * * * *`, runs in the instance timezone (set {{CONFIG.timezone}} in n8n settings) |
| t05 | No-show sweep | n8n-nodes-base.scheduleTrigger | 1.3 | Hourly no-show trigger plus 09:00 catch-up | Crons `0 * * * *` and `0 9 * * *`, runs in the instance timezone (set {{CONFIG.timezone}} in n8n settings) |
| t06 | Error trigger | n8n-nodes-base.errorTrigger | 1 | Starts the alert branch for unhandled errors | none |
| n01 | Normalize intake | n8n-nodes-base.code | 2 | Merge WhatsApp, form and email payloads into one canonical item | Reads `body.entry[0].changes[0].value.messages[0]` for WhatsApp, body for form, mail fields for email; sets action from `interactive.button_reply.id` prefix |
| n02 | Route reply type | n8n-nodes-base.switch | 2 | Route quick replies and new requests | Five rules on a combined value1 (action plus reply kind): new_booking to n03, slot_choice_button to n27, slot_choice_digit to n27a, cancel and reschedule to n29 (both resolve the booking by phone first) |
| n03 | Parse request | n8n-nodes-base.code | 2 | Extract name, phone, service, date, time from free text | Regex for today, tomorrow, weekday names, HH:MM and service keywords from {{CONFIG.services}} |
| n04 | Request parseable? | n8n-nodes-base.if | 2 | Gate on parse success | Conditions: date, time and service all present |
| n05 | Guided prompt | n8n-nodes-base.whatsApp | 1.1 | Ask for the missing booking fields | Text "Which service, which day, what time? Example: Book a haircut tomorrow at 4 PM." |
| n06 | Done guided | n8n-nodes-base.noOp | 1 | Terminal for the guided prompt branch | none |
| n07 | Resolve slot | n8n-nodes-base.code | 2 | Convert the request to concrete start and end ISO in the client timezone | Luxon with {{CONFIG.timezone}}, duration from {{CONFIG.services}}, booking_id = {{CONFIG.booking_id_prefix}} + phone last 4 + start epoch seconds |
| n08 | Slot in business hours? | n8n-nodes-base.if | 2 | Gate on business hours and validity | Conditions: valid flag and inside {{CONFIG.business_hours}} |
| n09 | Guided prompt 2 | n8n-nodes-base.whatsApp | 1.1 | Ask for a different time | Text with the client's {{CONFIG.business_hours}} and a valid example |
| n10 | Done guided 2 | n8n-nodes-base.noOp | 1 | Terminal for the second guided prompt | none |
| n11 | Read bookings sheet | n8n-nodes-base.googleSheets | 4.7 | Read all bookings rows for dedupe | Operation read, sheet {{CONFIG.bookings_sheet_name}}, returnAll |
| n12 | Dedupe filter | n8n-nodes-base.code | 2 | Find duplicates within the dedupe window | Same phone + service + start_at within {{CONFIG.dedupe_window_minutes}} minutes; outputs duplicateCount |
| n13 | Duplicate intake? | n8n-nodes-base.if | 2 | Gate on duplicate match | Condition: `={{ $json.duplicateCount }}` greater than 0; true to n14, false to n28 |
| n14 | Already booked | n8n-nodes-base.whatsApp | 1.1 | Tell the customer a booking already exists | Text "You already have this booking. Reply Cancel to change it." |
| n15 | Done duplicate | n8n-nodes-base.noOp | 1 | Terminal for the duplicate branch | none |
| n16 | Check availability | n8n-nodes-base.googleCalendar | 1.3 | Free/busy query for the resolved slot | Operation availability, calendars {{CONFIG.calendar_ids}}, timeMin/start, timeMax/end, retryOnFail 3 with 1s between tries (fixed interval) |
| n17 | Slot available? | n8n-nodes-base.if | 2 | Gate on free/busy result | Condition: `={{ $json.busy?.length ?? 0 }}` equals 0 |
| n18 | Next free slots | n8n-nodes-base.googleCalendar | 1.3 | Scan the next free slots | Availability over {{CONFIG.recovery_slot_count}} slots at {{CONFIG.slot_step_minutes}} minute steps inside {{CONFIG.business_hours}} |
| n19 | Slot buttons | n8n-nodes-base.httpRequest | 4.5 | Send the next free slots as interactive quick-reply buttons | Method POST, url https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages, header Authorization Bearer {{CONFIG.whatsapp_token}}, JSON body interactive type button with ids SLOT_alt_<iso>_<booking_id>, onError continueErrorOutput; success to n20, error to n19f |
| n19f | Alternatives fallback text | n8n-nodes-base.whatsApp | 1.1 | Plain text fallback when the interactive send fails | Text "The time is not available. Reply 1, 2 or 3 for the slots below", lists the slots; main to n19p |
| n19p | Mark alt offer pending | n8n-nodes-base.googleSheets | 4.7 | Record the open offer for digit replies | Operation update, matching booking_id, pending_offer=alt, status unchanged; to n20 |
| n20 | Done alternatives | n8n-nodes-base.noOp | 1 | Terminal for the alternatives branch | none |
| n21 | Create event | n8n-nodes-base.googleCalendar | 1.3 | Insert the calendar event | Operation event create, calendarId {{CONFIG.calendar_id}}, summary "{{CONFIG.client_name}} - Service", description with phone, notes and attendance marker note, attendees empty, retryOnFail 3 |
| n22 | Log booking | n8n-nodes-base.googleSheets | 4.7 | Append the booking row | Operation append, sheet {{CONFIG.bookings_sheet_name}}, status confirmed, columns per section 6 |
| n23 | Confirm | n8n-nodes-base.whatsApp | 1.1 | Send the confirmation template | Operation sendTemplate, template {{CONFIG.whatsapp_template_confirm}}, components with service, time and {{CONFIG.location_text}} parameters; the approved template carries the fixed-payload Cancel and Reschedule buttons; error branch to n24 |
| n24 | Confirm fallback text | n8n-nodes-base.whatsApp | 1.1 | Plain text confirmation on template rejection | Text mirroring the template, from {{CONFIG.whatsapp_phone_number_id}} |
| n25 | Slack notify new booking | n8n-nodes-base.slack | 2.7 | Post to the bookings channel when Slack is enabled | Channel #{{CONFIG.slack_bookings_channel}}, text with customer, service, start_at, source; reached only when {{CONFIG.slack_enabled}} is true |
| n25a | Notify new booking? | n8n-nodes-base.if | 2 | Gate the new-booking alert on the Slack flag | Condition: {{CONFIG.slack_enabled}} equals true; true to n25, false to n25b |
| n25b | Owner notify new booking | n8n-nodes-base.whatsApp | 1.1 | WhatsApp template alert to the owner when Slack is off | Operation sendTemplate, template {{CONFIG.whatsapp_template_owner}}, recipient {{CONFIG.owner_whatsapp_number}}, body with event type, service, start_at, booking id, phone |
| n26 | Done booking | n8n-nodes-base.noOp | 1 | Terminal for the booking branch | none |
| n27 | Parse slot choice | n8n-nodes-base.code | 2 | Parse a button callback | n02 already splits digit replies to n27a, so this node only sees callbacks: split SLOT_<ctx>_<iso>_<booking_id> into context (alt to alternative, rec to recovery, res to reschedule), start_at, booking_id, end_at from the service duration (default 60 minutes, Open questions 12); single output to n28 |
| n27a | Read customer rows | n8n-nodes-base.googleSheets | 4.7 | Read the customer's rows to resolve a digit reply | Operation read, sheet {{CONFIG.bookings_sheet_name}}, filter phone equals |
| n27b | Resolve digit context | n8n-nodes-base.code | 2 | Map a digit reply to the open offer | Picks the latest row with pending_offer set and a live status (confirmed, reminded_24h, reminded, reminder_failed, no_show); sets context, booking_id, phone and the resolved flag; single output to n27b2 |
| n27b2 | Digit context found? | n8n-nodes-base.if | 2 | Route a digit with an open offer, or to the guided prompt | Condition: resolved equals true; true to n27c, false to n05 |
| n27c | Recompute slots | n8n-nodes-base.googleCalendar | 1.3 | Recompute the free slots for the digit index | Availability over {{CONFIG.recovery_slot_count}} slots at {{CONFIG.slot_step_minutes}} minute steps |
| n27d | Pick digit slot | n8n-nodes-base.code | 2 | Select the Nth free slot | Takes slot_index from n27, picks the matching free slot, sets start_at, end_at and booking payload; to n28 |
| n28 | Merge intake paths | n8n-nodes-base.merge | 2 | Join the new booking path and the slot choice path before availability | Mode append, two inputs: n13 false and n27/n27d |
| n29 | Read booking row | n8n-nodes-base.googleSheets | 4.7 | Look up the customer's bookings for cancel | Operation read, sheet {{CONFIG.bookings_sheet_name}}, filter phone equals |
| n29b | Select active booking | n8n-nodes-base.code | 2 | Pick the latest cancellable row | Prefers status confirmed, then reminded and reminded_24h, newest created_at first; to n30 |
| n29c | Route after select | n8n-nodes-base.switch | 2 | Route the resolved booking to cancel or reschedule | Rules on the Normalize intake action: cancel to n30, reschedule to n37 |
| n30 | Cancellable? | n8n-nodes-base.if | 2 | Status transition check for the cancel race | Conditions: status equals confirmed OR equals reminded OR equals reminded_24h OR equals reminder_failed, combinator or |
| n31 | Cancel event | n8n-nodes-base.googleCalendar | 1.3 | Delete the calendar event | Operation event delete, eventId from the row |
| n32 | Mark cancelled | n8n-nodes-base.googleSheets | 4.7 | Update the row status | Operation update, filter booking_id, status cancelled |
| n33 | Cancelled reply | n8n-nodes-base.whatsApp | 1.1 | Confirm the cancellation | Text "Booking cancelled. Book again anytime." |
| n34 | Done cancel | n8n-nodes-base.noOp | 1 | Terminal for the cancel branch | none |
| n35 | Not cancellable reply | n8n-nodes-base.whatsApp | 1.1 | Explain the booking already changed | Text "This booking was already changed. Reply or call us to fix it." |
| n36 | Done cancel 2 | n8n-nodes-base.noOp | 1 | Terminal for the not-cancellable branch | none |
| n37 | Reschedule slots | n8n-nodes-base.googleCalendar | 1.3 | Scan free slots for the reschedule offer | Availability over {{CONFIG.recovery_slot_count}} slots at {{CONFIG.slot_step_minutes}} minutes |
| n38 | Reschedule buttons | n8n-nodes-base.httpRequest | 4.5 | Offer the slots as interactive quick-reply buttons | Same Graph API call as n19, ids SLOT_res_<iso>_<booking_id>, onError continueErrorOutput; success to n39, error to n38f |
| n38f | Reschedule fallback text | n8n-nodes-base.whatsApp | 1.1 | Plain text fallback for the reschedule offer | Text "Pick a new time. Reply 1, 2 or 3 for the slots below", lists the slots; to n38p |
| n38p | Mark res offer pending | n8n-nodes-base.googleSheets | 4.7 | Record the open reschedule offer | Operation update, matching booking_id, pending_offer=res; to n39 |
| n39 | Done reschedule offer | n8n-nodes-base.noOp | 1 | Terminal for the reschedule offer | none |
| n40 | Read old row | n8n-nodes-base.googleSheets | 4.7 | Read rows with the same booking id | Operation read, sheet {{CONFIG.bookings_sheet_name}}, filter booking_id |
| n41 | Select old row | n8n-nodes-base.code | 2 | Pick the old row whose start_at differs from the new slot | Filters out the row just created; returns the old event_id and start_at |
| n42 | Cancel old event | n8n-nodes-base.googleCalendar | 1.3 | Delete the old event after the reschedule is confirmed | Operation event delete, eventId from n41 |
| n43 | Mark old row cancelled | n8n-nodes-base.googleSheets | 4.7 | Set the old row to cancelled | Operation update, filter booking_id and start_at, status cancelled, note rescheduled |
| n44 | Done reschedule | n8n-nodes-base.noOp | 1 | Terminal for the reschedule branch | none |
| n45 | Slack notify recovery rebook | n8n-nodes-base.slack | 2.7 | Alert on a no-show recovery click when Slack is enabled | Channel #{{CONFIG.slack_bookings_channel}}, text with booking id and new slot; reached only when {{CONFIG.slack_enabled}} is true |
| n45a | Notify recovery rebook? | n8n-nodes-base.if | 2 | Gate the recovery rebooking alert on the Slack flag | Condition: {{CONFIG.slack_enabled}} equals true; true to n45, false to n45b |
| n45b | Owner notify recovery rebook | n8n-nodes-base.whatsApp | 1.1 | WhatsApp template alert to the owner when Slack is off | Operation sendTemplate, template {{CONFIG.whatsapp_template_owner}}, recipient {{CONFIG.owner_whatsapp_number}}, body with event type, start_at, booking id, phone |
| n46 | Done recovery | n8n-nodes-base.noOp | 1 | Terminal for the recovery rebook branch | none |
| n47 | Done alternative pick | n8n-nodes-base.noOp | 1 | Terminal for the alternative pick branch | none |
| n48 | Post-slot router | n8n-nodes-base.switch | 2 | Route after confirm by context flag | Rules on context: new_booking to n25a, reschedule to n40, recovery to n45a, alternative to n47 |
| n49 | Read bookings for reminders | n8n-nodes-base.googleSheets | 4.7 | Read all rows for the reminder sweep | Operation read, sheet {{CONFIG.bookings_sheet_name}}, returnAll |
| n50 | Find due bookings | n8n-nodes-base.code | 2 | Rows inside the reminder windows | hours_until between 0 and {{CONFIG.reminder_lead_24h}}, status in (confirmed, reminded_24h, reminder_failed), attempts below {{CONFIG.max_reminder_attempts}}; emits reminder_type 24h or 2h |
| n51 | Reminder type? | n8n-nodes-base.if | 2 | Pick the 24h or 2h branch | Condition: reminder_type equals 24h |
| n52 | Send reminder 24h | n8n-nodes-base.whatsApp | 1.1 | 24-hour reminder template | Template {{CONFIG.whatsapp_template_reminder}} with booking time; error branch to n53 |
| n53 | Reminder 24h fallback | n8n-nodes-base.whatsApp | 1.1 | Plain text 24h reminder | Text mirroring the template, from {{CONFIG.whatsapp_phone_number_id}}; main to n56, error to n58 |
| n54 | Send reminder 2h | n8n-nodes-base.whatsApp | 1.1 | 2-hour reminder template | Template {{CONFIG.whatsapp_template_reminder}} with booking time; error branch to n55 |
| n55 | Reminder 2h fallback | n8n-nodes-base.whatsApp | 1.1 | Plain text 2h reminder | Text mirroring the template, from {{CONFIG.whatsapp_phone_number_id}}; main to n57, error to n58 |
| n56 | Mark 24h sent | n8n-nodes-base.googleSheets | 4.7 | Status to reminded_24h | Operation update, filter event_id, status reminded_24h |
| n57 | Mark 2h sent | n8n-nodes-base.googleSheets | 4.7 | Status to reminded | Operation update, filter event_id, status reminded |
| n58 | Mark reminder failed | n8n-nodes-base.googleSheets | 4.7 | Record the failed attempt | Operation update, filter event_id, status reminder_failed, reminder_attempts + 1 |
| n59 | Retries left? | n8n-nodes-base.if | 2 | Check the attempt counter | Condition: reminder_attempts below {{CONFIG.max_reminder_attempts}}; true to n60, false to n61a |
| n60 | Done retry next sweep | n8n-nodes-base.noOp | 1 | Terminal, retry at the next sweep | none |
| n61 | Slack reminder alert | n8n-nodes-base.slack | 2.7 | Alert after max attempts when Slack is enabled | Channel #{{CONFIG.slack_alerts_channel}}, text with booking_id, event_id, attempts; reached only when {{CONFIG.slack_enabled}} is true |
| n61a | Reminder alert? | n8n-nodes-base.if | 2 | Gate the reminder alert on the Slack flag | Condition: {{CONFIG.slack_enabled}} equals true; true to n61, false to n61b |
| n61b | Owner reminder alert | n8n-nodes-base.whatsApp | 1.1 | WhatsApp template alert to the owner when Slack is off | Operation sendTemplate, template {{CONFIG.whatsapp_template_owner}}, recipient {{CONFIG.owner_whatsapp_number}}, body with event type, service, start_at, booking id, phone |
| n62 | Done alert | n8n-nodes-base.noOp | 1 | Terminal after the alert | none |
| n63 | Read bookings for no-show | n8n-nodes-base.googleSheets | 4.7 | Read all rows for the no-show sweep | Operation read, sheet {{CONFIG.bookings_sheet_name}}, returnAll |
| n64 | Find passed events | n8n-nodes-base.code | 2 | Events past their slot and unclosed | start_at older than now minus {{CONFIG.no_show_grace_minutes}}, status in (confirmed, reminded_24h, reminded, reminder_failed) |
| n65 | Check attendance | n8n-nodes-base.googleCalendar | 1.3 | Fetch the event and check the attendance marker | Operation event get, eventId from the row |
| n66 | Attended? | n8n-nodes-base.if | 2 | Gate on the marker (human in the loop) | Condition: description contains {{CONFIG.attendance_marker}} |
| n67 | Close event | n8n-nodes-base.noOp | 1 | Terminal for the attended branch | none |
| n68 | Mark no_show | n8n-nodes-base.googleSheets | 4.7 | Status to no_show before recovery | Operation update, filter booking_id, status no_show |
| n69 | Next recovery slots | n8n-nodes-base.googleCalendar | 1.3 | Scan free slots for the recovery message | Availability over {{CONFIG.recovery_slot_count}} slots at {{CONFIG.slot_step_minutes}} minutes |
| n70 | Recovery | n8n-nodes-base.whatsApp | 1.1 | Send the recovery template | Operation sendTemplate, template {{CONFIG.whatsapp_template_recovery}}, components with time parameter; error branch to n71, success to n70s |
| n70s | Send recovery slots | n8n-nodes-base.httpRequest | 4.5 | Offer instant rebooking slots as quick-reply buttons | Same Graph API call as n19, ids SLOT_rec_<iso>_<booking_id>, onError continueErrorOutput; success to n72, error to n70f |
| n70f | Recovery slots fallback text | n8n-nodes-base.whatsApp | 1.1 | Plain text fallback with the slot list | Text "We missed you today. Reply 1, 2 or 3 to rebook now", lists the slots; to n70p |
| n70p | Mark rec offer pending | n8n-nodes-base.googleSheets | 4.7 | Record the open recovery offer | Operation update, matching booking_id, pending_offer=rec; to n72 |
| n71 | Recovery fallback text | n8n-nodes-base.whatsApp | 1.1 | Plain text recovery message | Text mirroring the template, from {{CONFIG.whatsapp_phone_number_id}} |
| n72 | Done no-show | n8n-nodes-base.noOp | 1 | Terminal after the recovery send | none |
| n73 | Slack alert | n8n-nodes-base.slack | 2.7 | Post to the alerts channel from the error trigger when Slack is enabled | Channel #{{CONFIG.slack_alerts_channel}}, text with workflow, node and error message; reached only when {{CONFIG.slack_enabled}} is true |
| n73a | Alert? | n8n-nodes-base.if | 2 | Gate the error alert on the Slack flag | Condition: {{CONFIG.slack_enabled}} equals true; true to n73, false to n73b |
| n73b | Owner alert | n8n-nodes-base.whatsApp | 1.1 | WhatsApp template alert to the owner when Slack is off | Operation sendTemplate, template {{CONFIG.whatsapp_template_owner}}, recipient {{CONFIG.owner_whatsapp_number}}, body with event type, error node, error message, workflow name |

## 5. End-to-end flow narrative

Intake. A WhatsApp message arrives at t01, a web form POST at t02, or an email at t03 (disabled placeholder until the mailbox approach is confirmed). n01 normalizes every channel into one canonical payload and detects a quick reply by the button id or title: a `SLOT_` id is a slot choice, a button id or title matching cancel or reschedule is a cancel or reschedule request, and anything else is a new booking request. Template quick-reply buttons carry no settable payload in WhatsApp Manager, so n01 also matches the button title case-insensitively (quirk #9). n02 routes these actions. Form and email payloads are new bookings by default.

New booking. n03 parses the free text with regex: "today", "tomorrow", weekday names, HH:MM and service keywords from the config service list. If any field is missing, n04 sends the customer to n05, the guided prompt ("Which service, which day, what time?"), and the conversation stays in the intake stage: the next message returns through t01 and n02 as a new booking attempt. This replaces the Wait-based follow-up chain of the reference demo, because WhatsApp Cloud replies arrive as webhook events anyway; a Wait node would only delay the reply and is not needed.

On a successful parse, n07 resolves the slot with Luxon in {{CONFIG.timezone}}, validates business hours, looks up the service duration from {{CONFIG.services}} and generates a deterministic booking_id (prefix + phone last 4 + start epoch seconds), stable across retries. n08 routes out-of-hours requests to n09, which asks for another time. Otherwise n11 reads the bookings sheet and n12 filters duplicates: the same phone, service and start_at within the last {{CONFIG.dedupe_window_minutes}} minutes. n13 sends duplicates to n14 ("You already have this booking") and n15; the rest pass to n28.

Slot choice. A `SLOT_<ctx>_<iso>_<booking_id>` button reply returns through t01; n01 marks the reply kind as button, n02 routes it as slot_choice_button to n27, which parses the context (alt, rec or res), the slot and the booking id and passes straight to n28. A digit reply ("1", "2", "3") is routed by n02 as slot_choice_digit to n27a, which reads the customer's rows by phone; n27b picks the latest row with pending_offer set (the open offer written by n19p, n38p or n70p) and derives the context and booking id, n27b2 sends digits without an open offer to the guided prompt, n27c recomputes the free slots exactly as the offer did, and n27d picks the Nth slot. Both paths reach n28, which merges them with the dedupe-pass path and continues at n16.

Quick-reply mechanism. The n8n WhatsApp node has no interactive-message operation, so dynamic slot buttons are sent by the HTTP Request node (n19, n38, n70s) straight to the WhatsApp Graph API `/messages` endpoint with an interactive button body; ids carry the full routing context `SLOT_<ctx>_<iso>_<booking_id>`. The Cancel and Reschedule buttons live inside the approved confirmation template with fixed payloads, so those replies carry no booking id and the flow resolves the booking by phone (n29, n29b). If an interactive send fails, the fallback text nodes list the same slots and the customer replies with a digit, resolved through the pending_offer column.

Availability. n16 runs a free/busy query for the slot immediately before creation, doubling as the re-check that closes the double-booking race, with 3 retries and backoff. If the slot is busy, n17 sends the request to n18, which scans the next free slots inside business hours, and n19 offers them as quick-reply buttons carrying `SLOT_alt_<iso>_<booking_id>` (text fallback n19f with the pending_offer marker n19p). Picking one loops back through t01, n02, n27 and n28, and availability and creation run again for the new slot.

Booking. If the slot is free, n21 creates the event with summary "{{CONFIG.client_name}} - Service" and a description holding the phone, notes and the attendance marker line. n22 appends the row to the bookings sheet with status confirmed. n23 sends the confirmation template with the service, time, {{CONFIG.location_text}} and the Reschedule and Cancel buttons; on template rejection it falls back to plain text via n24. n48 routes the context flag: a new booking reaches n25a, which posts to Slack via n25 when {{CONFIG.slack_enabled}} is true or alerts the owner by WhatsApp template via n25b when it is false, then n26; an alternative pick ends at n47; a recovery pick reaches n45 (Slack) and n46; a reschedule continues at n40, which reads the rows with the same booking id, n41 selects the old row (start_at differs from the new slot), n42 deletes the old calendar event, n43 marks the old row cancelled, and n44 closes.

Cancel. A Cancel button reply (fixed payload) routes to n29, which reads the customer's rows by phone, and n29b picks the latest cancellable row. n30 only lets the flow continue when the status is still confirmed, reminded, reminded_24h or reminder_failed, which handles the cancel-while-confirming race. n31 deletes the calendar event, n32 marks the row cancelled, n33 confirms to the customer and n34 closes. When the status already changed, n35 explains and n36 closes.

Reschedule offer. A Reschedule button reply (fixed payload, no booking id) is resolved by phone through n29 and n29b like a cancel, and n29c then sends it to n37, which scans the next free slots, and n38 offers them as quick-reply buttons carrying the old booking id in the callback (text fallback n38f with the pending_offer marker n38p). Picking one returns to the slot choice path; the reschedule cleanup in the previous paragraph runs after the new event is created and logged, keeping one booking_id per customer intent as required by the idempotency rules.

Reminders. t04 fires every hour. n49 (Read bookings for reminders) reads the sheet, n50 keeps rows whose start_at falls inside the reminder windows with status confirmed, reminded_24h or reminder_failed and attempts below the max, tagging each as 24h or 2h. n51 picks the branch: n52 sends the 24-hour template (plain text fallback n53), n54 the 2-hour template (fallback n55); successes reach n56 or n57 and mark the row reminded_24h or reminded. Any failure reaches n58, which sets status reminder_failed and increments the attempt counter; n59 then either lets the next sweep retry (n60) or alerts once attempts hit the max (n61a routes to Slack n61 or the owner template n61b, then n62).

No-show recovery. t05 fires hourly plus a 09:00 catch-up. n63 (Read bookings for no-show) reads the sheet, n64 keeps rows whose start_at is more than {{CONFIG.no_show_grace_minutes}} minutes in the past with status confirmed, reminded_24h, reminded or reminder_failed. For each row, n65 fetches the calendar event and n66 checks for the attendance marker. This is the main human-in-the-loop point: the team marks attendance by appending {{CONFIG.attendance_marker}} to the event description in Google Calendar, a one-tap edit at the desk. If the marker exists, n67 closes the event. If not, n68 marks the row no_show first so the sweep cannot re-pick it, n69 scans the next free slots, n70 sends the recovery template, and n70s offers the slots as quick-reply buttons (text fallback n70f with the pending_offer marker n70p). A slot pick returns through t01, n02 and n27, reuses the whole booking path with the same booking_id, and n45a routes the recovery rebooking to Slack via n45 or the owner template via n45b.

Error path. Any unhandled error in an execution fires t06 and n73a routes the alert to Slack via n73 or the owner template via n73b; when Slack is enabled it posts the workflow name, node and error to #{{CONFIG.slack_alerts_channel}}. Calendar and WhatsApp node calls additionally retry 3 times with a 1s wait between tries before the error workflow sees them.

## 6. Data model

Canonical intake payload (n01 output):

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

Web form payload (t02 input, from the sheet):

```json
{ "name": "Ravi Das", "phone": "88017XXXXXXXX", "service": "Haircut", "date": "2026-08-12", "time": "16:00", "notes": "", "source": "instagram" }
```

Resolved booking payload (n07 output):

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

WhatsApp callback and reply formats (n02 and n48 routing keys):

```
SLOT_alt_<iso>_<booking_id>     slot choice from the alternatives offer
SLOT_rec_<iso>_<booking_id>     slot choice from the recovery offer
SLOT_res_<iso>_<booking_id>     slot choice from the reschedule offer
CANCEL                          template button matched by id or title (case-insensitive), booking resolved by phone
RESCHED                         template button matched by id or title (case-insensitive), offers slots via n37/n38
"1".."9"                        digit reply to a fallback text offer, context from pending_offer
```

Template quick-reply buttons have no payload field in WhatsApp Manager; Meta
derives the webhook id from the button itself, so n01 matches id or title
(quirk #9). The SLOT_ ids are set by our own Graph API interactive messages
and always carry the full callback payload.

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
| status | string | confirmed | confirmed, reminded_24h, reminded, attended, no_show, rescheduled, cancelled, reminder_failed |
| source | string | whatsapp | whatsapp, web, email |
| reminder_attempts | number | 0 | extension column, see Open questions 5 |
| pending_offer | string |  | internal column: alt, rec or res while an offer is open, see Open questions 5 |
| created_at | timestamp | 2026-08-11T10:05+06:00 | |

Storage layout. Google Calendar is the source of truth for events: summary "{{CONFIG.client_name}} - Service", description holds phone, notes and the attendance marker line, attendees empty. Google Sheets holds the log in a tab named {{CONFIG.bookings_sheet_name}} (clientname_bookings by convention). Slack channels: #{{CONFIG.slack_bookings_channel}} for business events, #{{CONFIG.slack_alerts_channel}} for operational alerts.

## 7. Per-client config extraction

| Config token | Description | Sheet section 8 item |
| --- | --- | --- |
| {{CONFIG.google_calendar_credential}} | n8n credential name for Google Calendar (OAuth or service account) | 1 |
| {{CONFIG.calendar_ids}} | Calendar id(s) for availability queries | 2 |
| {{CONFIG.calendar_id}} | Primary calendar id for event creation | 2 (derived) |
| {{CONFIG.services}} | Map of service names to duration_minutes and price | 3 |
| {{CONFIG.business_hours}} | Open and close times and working days | 4 |
| {{CONFIG.timezone}} | IANA timezone, e.g. Asia/Dhaka | 4 |
| {{CONFIG.whatsapp_credential}} | WhatsApp Cloud API credential in n8n | 5 |
| {{CONFIG.whatsapp_template_confirm}} | Approved confirmation template id | 5 |
| {{CONFIG.whatsapp_template_reminder}} | Approved reminder template id | 5 |
| {{CONFIG.whatsapp_template_recovery}} | Approved recovery template id | 5 |
| {{CONFIG.whatsapp_template_language}} | Template language code, e.g. en_US | 5 (derived) |
| {{CONFIG.whatsapp_phone_number_id}} | Meta phone number id for the Graph API messages endpoint | 5 (derived) |
| {{CONFIG.whatsapp_token}} | Meta WhatsApp Cloud API access token | 5 (derived) |
| {{CONFIG.whatsapp_api_version}} | Graph API version prefix, e.g. v21.0 | 5 (derived) |
| {{CONFIG.phone_country_code}} | Country code prepended to local phone numbers, e.g. 880 | 5 (derived) |
| {{CONFIG.webhook_path_form}} | n8n webhook path for the booking form | 6 |
| {{CONFIG.webhook_path_whatsapp}} | n8n webhook path for WhatsApp, registered in Meta | 6 (derived) |
| {{CONFIG.sheets_spreadsheet_id}} | Google Sheets spreadsheet id | 7 |
| {{CONFIG.bookings_sheet_name}} | Sheet tab name, clientname_bookings | 7 |
| {{CONFIG.slack_credential}} | Slack credential (app or incoming webhook) | 8 |
| {{CONFIG.slack_bookings_channel}} | #bookings channel name | 8 |
| {{CONFIG.slack_alerts_channel}} | #alerts channel name | 8 (derived, sheet 6.5) |
| {{CONFIG.slack_enabled}} | Team alert switch: true for Slack, false for the owner WhatsApp template | 8 (derived) |
| {{CONFIG.owner_whatsapp_number}} | Owner number for the WhatsApp alert template when Slack is disabled | 8 (derived) |
| {{CONFIG.whatsapp_template_owner}} | Approved owner alert template id | 5 (derived) |
| {{CONFIG.reminder_lead_24h}} | 24-hour reminder lead, default 24 | 9 |
| {{CONFIG.reminder_lead_2h}} | 2-hour reminder lead, default 2 | 9 |
| {{CONFIG.no_show_grace_minutes}} | No-show window after start, default 30 | 10 |
| {{CONFIG.location_text}} | Branch address or location text for the confirmation | 11 |
| {{CONFIG.client_name}} | Client display name, prefixes calendar summary and Slack text | 11 (derived) |
| {{CONFIG.booking_id_prefix}} | Booking id prefix, e.g. BK | section 7 example (derived) |
| {{CONFIG.dedupe_window_minutes}} | Dedupe window, default 10 | sheet 6.4 (derived) |
| {{CONFIG.max_reminder_attempts}} | Max reminder attempts, default 3 | sheet 6.5 (derived) |
| {{CONFIG.recovery_slot_count}} | Slots offered in alternatives and recovery, default 3 | sheet 6.1 (derived) |
| {{CONFIG.slot_step_minutes}} | Availability scan step, default 30 | build detail (derived) |
| {{CONFIG.attendance_marker}} | String the team appends to the event description to mark attendance | sheet 6.2 (derived) |
| {{CONFIG.email_imap_credential}} | IMAP credential if email intake is enabled | sheet 4.1 (derived) |
| {{CONFIG.email_intake_folder}} | IMAP folder to poll, default INBOX | sheet 4.1 (derived) |

## 8. Error handling and resilience

Retry policy. Google Calendar and WhatsApp node calls set retryOnFail to 3 with a fixed 1s wait between tries at node level (n8n retries use a fixed interval, not exponential backoff). Reminder sends are retried on the next hourly sweep up to {{CONFIG.max_reminder_attempts}} times, then alert. Calendar failures never confirm a booking: availability is a hard gate before event creation.

Timeout strategy. Webhook executions run synchronously with a short connection timeout on HTTP calls; no long Wait nodes are used anywhere, so the only long-running state is the sheet log. Sweeps are scheduled executions and can take minutes without affecting the customer.

Idempotency keys. booking_id is generated deterministically in n07 and reused for all reminders, cancels and rebookings. Reminder and no-show updates are keyed by event_id or booking_id, so a re-run of a sweep cannot double-send or double-update. The dedupe filter in n12 suppresses duplicate intake on (phone + start ISO + service) within {{CONFIG.dedupe_window_minutes}} minutes. The no-show sweep marks the row no_show before sending, so it can never re-pick the same event.

External API down. Google Calendar down: availability fails safe, the customer is never confirmed into an unknown slot, node retries run, and the error workflow alerts on Slack. WhatsApp down: sends fail, reminders are retried by the next sweep, and the error workflow alerts. Slack down: n25, n45 and n61 set continue on fail, so a Slack outage is log-only and never blocks the booking flow (sheet failure mode 8). Slack disabled: {{CONFIG.slack_enabled}} false routes every team alert through the owner WhatsApp template (n25b, n45b, n61b, n73b), which reuses the existing WhatsApp infrastructure at the cost of one extra approved template. Sheets down: the intake flow stops with an alert; no event is created without a log row, keeping calendar and sheet consistent.

Double-booking race. Availability is re-checked immediately before creation (n16 right before n21); on conflict the customer is offered the next free slots.

Template rejection. Every business-initiated WhatsApp message uses an approved template; on a 403 or template error the sender falls back to a plain text message from the business number (n24, n53, n55, n71).

Interactive send failure. The slot-offer buttons go through the Graph API HTTP nodes; on error they fall back to a numbered text list and a digit reply (n19f/n19p, n38f/n38p, n70f/n70p). The pending_offer column is written only in the fallback path, so button replies never depend on it. The Graph API token lives in config; a wrong token fails the HTTP call and triggers the same fallback, so the customer still receives the slot list.

Edge case note. A 24-hour reminder that keeps failing until the slot is less than 2 hours away is retried with the 2-hour template on the next sweep. The customer still gets a reminder; the wrong-template case is acceptable and flagged in Open questions 7.

## 9. Failure-mode mapping

| Sheet failure mode | Where the blueprint handles it |
| --- | --- |
| Calendar API outage (5xx on availability) | n16 retries 3x with backoff, n17 never confirms blindly; t06 to n73 alert on Slack |
| Invalid date/time input (parse fails) | n04 false branch sends n05 guided prompt with a valid example; customer stays in intake |
| Double-booking race (two intake flows, same slot) | n12 dedupe window plus n16 re-check immediately before n21; n17 offers alternatives via n18 and n19 |
| Reminder not sent (status stuck at confirmed) | n58 marks reminder_failed and increments attempts; n50 re-picks the row next sweep; n59 to n61 alert after {{CONFIG.max_reminder_attempts}} failures |
| WhatsApp template not approved (send 403) | error branches of n23, n52, n54 and n70 to plain text fallbacks n24, n53, n55 and n71 |
| Timezone mismatch (event at wrong hour) | every datetime conversion runs through Luxon with {{CONFIG.timezone}} in n07, n50 and n64 |
| Cancel/reschedule race (cancel while confirming) | n30 deletes the event only when the row status is confirmed or reminded; quick-reply routing keeps the state transition single-threaded |
| Slack notify failure (5xx) | n25, n45 and n61 set continue on fail; log-only, no impact on the booking flow. With {{CONFIG.slack_enabled}} false the alerts go through the owner WhatsApp template (n25b, n45b, n61b, n73b) |

## 10. Stress-test plan

| # | Scenario | Test input | Expected output | Pass condition |
| --- | --- | --- | --- | --- |
| 1 | Happy path booking | WhatsApp "Book a haircut tomorrow at 4 PM" | Event created, confirmation sent, sheet row logged | Calendar event with summary "{{CONFIG.client_name}} - Haircut"; sheet row status confirmed; n25 Slack post (or n25b owner template when Slack is disabled) |
| 2 | Slot unavailable | Request a slot already booked in the calendar | Reply offers the next 3 free slots, no event created | n19 message contains 3 slot quick replies; no new calendar event; no new confirmed row |
| 3 | Malformed date | "Book haircut sometime" | Guided prompt reply, no crash | n05 message sent; no event created; error workflow silent |
| 4 | Duplicate intake | Same request twice within 10 minutes | One booking, one event | One sheet row, one calendar event, one confirmation message |
| 5 | Concurrent same-slot | 5 simultaneous requests for one slot | Exactly one event created, others get alternatives | Calendar contains exactly one event for the slot; 4 customers received n19 alternatives |
| 6 | 10x volume | 100 booking requests in one hour | All resolved, no double-booking | All 100 requests terminal; p95 under 20s per webhook execution; no duplicate events; no failed rows |
| 7 | Simulated calendar outage | Invalid calendar credentials | Availability fails safe, no confirmation, alert sent | No event created; n73/n73b alert sent; customer not confirmed |
| 8 | Reminder timing | Book an event 25h out, run sweeps | Reminders at 24h and 2h, status reminded, no duplicates | Two messages sent at the correct windows; row status reminded; re-running the sweep sends nothing new |
| 9 | No-show recovery | Mark event unattended after start | Recovery message sent, rebooking reuses booking_id | Recovery message received; slot pick produces a new event and row with the same booking_id; n45/n45b alert received |

## 11. Deployment steps

1. Provision a VPS: Hetzner CX22 tier ($3 to $6/month) or Oracle Cloud Always Free, Ubuntu 22.04 or newer.
2. Install Docker and Docker Compose, then run the official n8n image (`docker.n8n.io/n8nio/n8n`) with a named volume for data, or the n8n install script on the free tier.
3. Create the n8n credentials: Google Calendar (OAuth or service account), Google Sheets (same Google account), WhatsApp Cloud API, Slack (app with webhooks, only when {{CONFIG.slack_enabled}} is true), IMAP (only if email intake is enabled).
4. Create the Meta WhatsApp app, add the business number, and submit the four templates for approval: confirmation (with buttons Reschedule and Cancel), reminder, recovery (with slot quick replies), owner alert (plain text to {{CONFIG.owner_whatsapp_number}}). Approval takes days, start first.
5. Create the spreadsheet with a tab named {{CONFIG.bookings_sheet_name}} and the column headers from section 6.
6. Fill every token from section 7 into the config source (n8n variables or a per-client config JSON in the Code nodes). No real value may appear in node parameters.
7. Import the prototype JSON as the workflow "Bookings and No-Show Recovery". Import the same JSON a second time as "Booking Error Alerts", delete every node except t06, n73a, n73 and n73b, then register that workflow as the error workflow of the main workflow.
8. Set the n8n instance timezone to {{CONFIG.timezone}} (schedule triggers have no timezone parameter; they run in the instance or workflow timezone).
9. Copy the webhook URLs for t01 and t02 into the Meta app (WhatsApp webhook) and the booking form; verify the handshake challenge.
10. Run the validation checklist below, then the stress-test plan in section 10.

## 12. Validation checklist

- [ ] The workflow imports without schema errors; no red nodes in the editor
- [ ] Credentials named exactly as in the config tokens and connected to their nodes
- [ ] WhatsApp Graph API token and phone number id in config; a test interactive button message is received on the test phone
- [ ] Templates confirmed approved in Meta; template ids in config match
- [ ] Calendar free/busy returns the correct busy blocks for a known booked slot
- [ ] A test event created by n21 appears with the right summary, timezone and no attendees
- [ ] Sheet headers match section 6 exactly, including reminder_attempts
- [ ] Every node parameter contains only {{CONFIG.x}} tokens or expressions, no real client values
- [ ] Cron values verified on t04 and t05, instance timezone set to {{CONFIG.timezone}}
- [ ] Webhook handshake works for t01 and t02; form POST returns 200
- [ ] With {{CONFIG.slack_enabled}} true, Slack posts appear in #{{CONFIG.slack_bookings_channel}} and alerts go to #{{CONFIG.slack_alerts_channel}}; with it false, the owner alert template arrives at {{CONFIG.owner_whatsapp_number}}
- [ ] A forced error (wrong calendar credential) produces an n73/n73b alert and no customer message
- [ ] t03 is disabled and its placeholder status is understood
- [ ] n8n node typeVersions match the installed n8n version (verify during import)
- [ ] The reference demo pattern (quick-reply buttons, free-text intake) is reused; no Wait nodes in the flow

## 13. Open questions

1. Email intake: the sheet lists email in scope (section 4.1) but section 5 defines no email trigger or IMAP details, and the references list has no email node. The blueprint ships t03 as a disabled placeholder with config tokens; confirm the mailbox approach or drop email from v0.1.
2. Two crons in sheet section 5 (`0 9 * * *` and `0 * * * *`). The blueprint maps the hourly cron to both sweeps and uses 09:00 as a daily catch-up on the no-show sweep. Confirm this reading.
3. Attendance marker: the team marks attendance manually in the calendar. The blueprint checks for {{CONFIG.attendance_marker}} in the event description; confirm the convention (e.g. append "[ATTENDED]") and that the team can do the one-tap edit at the desk.
4. Reschedule UX: the sheet says reschedule is a quick-reply option. The blueprint answers the Reschedule button with the next free slots as quick replies (no free-text rescheduling). Confirm this is acceptable for the client.
5. Status extension: the sheet lists six statuses; the blueprint adds reminded_24h and reminder_failed plus the reminder_attempts column to enforce the max-attempts rule and to separate the two reminder leads (sheet 6.5 and 6.1). Confirm the extension.
6. Error workflow registration: the prototype is one JSON, so the error trigger and alert node live in the same file. Deployment step 7 imports the file twice and strips the second copy to the error branch. Confirm this split is acceptable.
7. Reminder retry edge: a 24-hour reminder that keeps failing until the slot is under 2 hours away is retried with the 2-hour template (see section 8). Confirm the client accepts this fallback.
8. Sheet metrics say the no-show flow runs "after the appointment end" while sections 6.1 and 10 say 30 minutes after start_at. The blueprint uses {{CONFIG.no_show_grace_minutes}} = 30 after start_at. Confirm which window the client wants.
9. The services list carries a price but v0.1 has no payment (out of scope, sheet 4.2). Price is stored but unused; harmless, confirmed.
10. The n8n WhatsApp node (1.1) has no interactive-message operation. The blueprint sends dynamic slot buttons via the HTTP Request node to the WhatsApp Graph API `/messages` endpoint (real integration, requires {{CONFIG.whatsapp_phone_number_id}}, {{CONFIG.whatsapp_token}}, {{CONFIG.whatsapp_api_version}}). Cancel and Reschedule live in the approved confirmation template with fixed payloads, so those replies are resolved by phone (n29, n29b, n29c); with several live bookings under one phone, the latest wins. Confirm this mechanism with the client before template approval.
11. The pending_offer column and the digit-reply fallback (section 6, n27a to n27d) are internal state: they only exist so a fallback text offer stays actionable when the Graph API call fails. Button replies never read pending_offer. Confirm the column extension alongside Open questions 5.
12. Slot-pick defaults: button and digit slot picks (n27, n27d) do not carry the service name in the callback, so end_at defaults to 60 minutes and the confirmation service field can be blank for alternative, recovery and reschedule picks. Confirm whether the client wants the service echoed in those messages; resolving it would add a sheet read to the button path.
13. Owner alert channel: stack research compared Slack, Telegram, email and WhatsApp templates for owner alerts. Telegram is the lowest-friction channel (BotFather, about 30 seconds, free, no approval) and the pragmatic recommendation for pure owner alerts. The blueprint uses a WhatsApp template to {{CONFIG.owner_whatsapp_number}} because the WhatsApp infrastructure already exists per client (marginal cost: one extra approved template plus per-message utility cost). The if gates n25a, n45a, n61a and n73a make the channel swappable without touching the flow; revisit if a client rejects the template approach.

## 14. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1.3 | 2026-08-14 | Pluggable team alerts (user decision B after stack research): Slack is gated by {{CONFIG.slack_enabled}}. When false, the four team alerts (new booking, recovery rebooking, reminder alert, error alert) route through new if gates n25a, n45a, n61a, n73a to WhatsApp template sends n25b, n45b, n61b, n73b using {{CONFIG.whatsapp_template_owner}} to {{CONFIG.owner_whatsapp_number}}. Node count 93 to 101 (6 triggers + 95 flow). Research confirmed: Google Calendar stays the availability source of truth (CalDAV is a community node, the Cal.com trigger is broken on API v1), pg_cron is redundant behind scheduleTrigger for message-sending sweeps, and Google Sheets append races are mitigated by the dedupe window plus the availability re-check before creation (stress test 5). |
| v0.1.2 | 2026-08-14 | Sandbox fix: WhatsApp Manager template quick-reply buttons have no payload field (quirk #9), so n01 now matches button replies by id or title, case-insensitive. Cancel and Reschedule work with human-readable button labels; SLOT_ callbacks from the Graph API interactive messages are unchanged. |
| v0.1.1 | 2026-08-11 | Prototype build fixes: n02 now routes five cases (slot_choice split into button and digit, cancel and reschedule both resolved by phone); reschedule resolves the old booking through n29, n29b and the new n29c router before offering slots; new n27b2 routes unanswered digits to the guided prompt; dedupe condition corrected to greater than 0; read nodes renamed to unique names (n49 Read bookings for reminders, n63 Read bookings for no-show); cancel and no-show gates extended with reminded_24h and reminder_failed; retry wording corrected to the fixed 1s interval n8n actually uses. |
| v0.1 | 2026-08-11 | Initial blueprint from sheet 04 (v0.2). Cost model ($8-31/month at 500 bookings) and failure modes unchanged from the sheet. One importable workflow with six triggers instead of the four-file split, to satisfy the single PROTOTYPE_PATH rule. Added reminded_24h and reminder_failed statuses and the reminder_attempts and pending_offer columns (Open questions 5 and 11). Replaced the demo's Wait-based follow-up with webhook reply routing (n02). Dynamic slot buttons are sent via the Graph API HTTP nodes because the WhatsApp node has no interactive operation (Open question 10, quirk #4); Cancel and Reschedule use fixed-payload template buttons resolved by phone. Node typeVersions verified against current n8n master: scheduleTrigger 1.3, googleCalendar 1.3, googleSheets 4.7, slack 2.7, webhook 2.1, httpRequest 4.5, merge 2 (entries added to BUGS-AND-QUIRKS.md). |
