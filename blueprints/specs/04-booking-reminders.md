> **Note (2026-08-27 pivot):** This spec is now subsumed by `00-omni-chat-core` unified build. Retained for traceability; see `blueprints/README.md` and `docs/specs/Omni-Unified-Spec.md`.

# Bookings and No-Show Recovery - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | booking-reminders |
| Name | Bookings and no-show recovery |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Scheduling happens in scattered messages, and forgotten bookings cost the business money. This blueprint turns any booking request into a confirmed calendar event with automatic confirmations and reminders over any channel, plus a no-show recovery flow that offers instant rebooking. For salons, clinics and consultancies.

## 3. Outcome metrics

- No-shows cut by at least 30% (assumes a 24-hour reminder plus a 2-hour reminder reach the customer on their preferred channel).
- 15 minutes of back-and-forth scheduling to under 2 minutes per booking (assumes availability is checked automatically before confirmation).
- 100% of bookings get a confirmation and a reminder (assumes WhatsApp delivery and calendar creation succeed or alert).
- Forgotten bookings recovered within 30 minutes of the missed slot (assumes the no-show flow runs on a schedule after the appointment end).

## 4. Scope

### 4.1 In scope

- Intake a booking request from a WhatsApp message, a web form webhook, or an email.
- Parse the requested service, date and time from free text.
- Check availability against Google Calendar (free/busy) before confirming.
- Create the calendar event with the customer name, phone and service.
- Send a confirmation message with reschedule and cancel options.
- Send reminders 24 hours and 2 hours before the start time.
- After the event end time, mark attended or no-show and run the recovery message for no-shows.
- Notify the team on Slack for every new booking and every no-show.

### 4.2 Out of scope

- No online payment or deposits in v0.1.
- No custom web app UI, no mobile app, and no client-side booking widget.
- No multi-location calendar routing beyond a config list of calendar ids.
- No waitlist management in v0.1 (documented extension point).
- No rescheduling by full natural-language conversation: reschedule and cancel are quick-reply options.

## 5. Inputs and triggers

Trigger 1: WhatsApp message (n8n node: Webhook, WhatsApp Cloud API payload). Fields read: `from`, `text.body`, `interactive.button_reply.title`, `contacts[0].profile.name`. Example text: "Book a haircut tomorrow at 4 PM".

Trigger 2: Booking web form (n8n node: Webhook, POST).

```json
{ "name": "Ravi Das", "phone": "88017XXXXXXXX", "service": "Haircut", "date": "2026-08-12", "time": "16:00", "notes": "", "source": "instagram" }
```

Trigger 3: Schedule (n8n node: Schedule Trigger) for reminder and no-show jobs. Cron `0 9 * * *` and `0 * * * *` (hourly sweep), timezone set per client.

## 6. Workflow design

### 6.1 Main flow

1. Trigger (WhatsApp / webhook / email) -> Code node "Parse request": extract name, phone, service, requested date and time. WhatsApp free text is parsed with regex for weekday names, "tomorrow", "today", HH:MM and service keywords.
2. IF node "Request parseable?": true continues; false replies with a guided prompt ("Which service, which day, what time?") and stays in the intake stage.
3. Code node "Resolve slot": convert the request to a concrete start ISO time in the client timezone.
4. Google Calendar node "Check availability": free/busy query for the resolved slot. Calendar id and working hours come from config.
5. IF node "Slot available?": true continues; false replies with the next 3 free slots from a second availability query.
6. Google Calendar node "Create event": summary "ClientName - Service", description with phone + notes, attendees left empty (no emails needed).
7. Google Sheets node "Log booking": append booking_id, customer, phone, service, start_at, end_at, status confirmed, event_id, created_at.
8. WhatsApp node "Confirm": send the confirmation with service, time, address, and quick-reply options (Reschedule, Cancel).
9. Reminder jobs (Schedule Trigger): query the bookings sheet for events starting in 24 hours and 2 hours with status confirmed; WhatsApp node sends the reminder template with the booking time. Update the sheet row status to reminded.
10. No-show sweep (Schedule Trigger, runs hourly after business end): find events whose start_at passed more than 30 minutes ago with status not attended/not reminded-failed; IF the calendar shows no attendance marker -> WhatsApp "Recovery": "We missed you today. Want to rebook now?" with quick-reply slot options. IF the customer picks a slot -> reuse steps 4-8.
11. Slack node: notify #bookings for every new booking and every no-show recovery click.
12. noOp "Done" at each terminal branch.

### 6.2 Branch logic

- IF "Request parseable?": guided prompt vs continue.
- IF "Slot available?": confirm vs offer alternatives.
- IF "Reminder window?": 24h, 2h, or neither.
- IF "Attended?": recovery vs close (attendance marker is a manual calendar update by the team).

### 6.3 Error handling

- Calendar API failure: do not confirm the booking; reply "checking availability, one moment" and retry with backoff; alert on Slack if still failing.
- Unparseable date/time: guided prompt with a valid example, keep the customer in the intake stage.
- Reminder send failure: mark the row status reminder_failed and retry at the next sweep; alert if the same event fails twice.
- Double-booking race: availability is checked again immediately before event creation; on conflict, offer the next free slot.
- WhatsApp template rejection: use an approved template per client; if the message type is not approved, fall back to a plain text message from the business number.

### 6.4 Idempotency

- Booking id generated once at creation and reused for all reminders.
- Dedupe intake on (phone + requested start ISO + service) within a 10-minute window.
- Reminder and no-show jobs are keyed by event_id so a re-run never double-sends.
- Rebooking from the recovery flow reuses the original booking_id with a new status.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Google Calendar and WhatsApp calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Reminder sends: retried on the next hourly sweep, max 3 attempts.

## 7. Data model

Storage: Google Calendar (source of truth for events) plus Google Sheets log.

Sheet "bookings":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| booking_id | string | BK-1001 | generated once |
| event_id | string | 7m2k9q... | Google Calendar event id |
| customer_name | string | Ravi Das | |
| phone | string | 88017XXXXXXXX | |
| service | string | Haircut | |
| start_at | datetime | 2026-08-12T16:00+06:00 | client timezone |
| end_at | datetime | 2026-08-12T17:00+06:00 | duration from config |
| status | string | confirmed | confirmed, reminded, attended, no_show, rescheduled, cancelled |
| source | string | whatsapp | whatsapp, web, email |
| created_at | timestamp | 2026-08-11T10:05+06:00 | |

Naming: sheet named clientname_bookings. Calendar events prefixed with the client name in the summary. Duration per service lives in config, not in the sheet.

## 8. Per-client configuration block

- [ ] Google Calendar account + service account credentials: ...
- [ ] Calendar id(s) for availability and event creation: ...
- [ ] Services list with duration and price: ...
- [ ] Business hours and timezone: ...
- [ ] WhatsApp business number + token + approved template ids (confirmation, reminder, recovery): ...
- [ ] Booking webhook URL (if web form intake): ...
- [ ] Google Sheets spreadsheet id + bookings sheet name: ...
- [ ] Slack webhook + #bookings channel: ...
- [ ] Reminder lead times (default 24h and 2h): ...
- [ ] No-show recovery window (default 30 min after start): ...
- [ ] Branch address / service location text for the confirmation: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| WhatsApp | $5-25 | 500 bookings/month, 1 confirmation + 2 reminders + recovery per booking, service-category conversations |
| Google Calendar | $0 | free tier |
| **Total** | **$8-31** | at 500 bookings/month |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Calendar API outage | 5xx on availability call | retry with backoff, never confirm a slot blindly |
| Invalid date/time input | parse fails | guided prompt with example, stay in intake |
| Double-booking race | two intake flows same slot | re-check availability before create, offer alternatives |
| Reminder not sent | status stuck at confirmed after sweep | retry next sweep, alert after 2 failures |
| WhatsApp template not approved | send 403 | fall back to plain text message |
| Timezone mismatch | event created at wrong hour | config timezone enforced on every datetime conversion |
| Cancel/reschedule race | customer cancels while confirming | quick-reply handling with status transition checks |
| Slack notify failure | 5xx | log-only, no impact on booking flow |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path booking | WhatsApp "Book a haircut tomorrow at 4 PM" | Event created, confirmation sent, sheet row logged |
| Slot unavailable | Request a slot already booked | Reply offers next 3 free slots, no event created |
| Malformed date | "Book haircut sometime" | Guided prompt reply, no crash |
| Duplicate intake | Same request twice within 10 min | One booking, one event |
| Concurrent same-slot | 5 simultaneous requests for one slot | Exactly one event created, others get alternatives |
| 10x volume | 100 booking requests in an hour | All resolved, p95 < 20s, no double-booking |
| Simulated calendar outage | Invalid calendar credentials | Availability fails safe: no confirmation, Slack alert |
| Reminder timing | Book an event 25h out, run sweeps | Reminder at 24h and 2h, status reminded, no duplicate sends |
| No-show recovery | Mark event unattended after start | Recovery message sent, rebooking reuses booking_id |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflow: public/downloads/whatsapp-order-bot.json (26 nodes). Reuse the quick-reply button pattern, free-text intake stage and Wait-based follow-up chain; replace the product flow with the calendar availability and event creation flow.
- Google Calendar API: developers.google.com/calendar (free/busy, events.insert).
- WhatsApp templates: developers.facebook.com/docs/whatsapp (template messaging and approval).
- n8n nodes: Schedule Trigger, Webhook, Google Calendar, Google Sheets, Code, IF, Wait, Slack, WhatsApp Cloud.
