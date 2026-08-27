> **Note (2026-08-27 pivot):** This spec is now subsumed by `00-omni-chat-core` unified build. Retained for traceability; see `blueprints/README.md` and `docs/specs/Omni-Unified-Spec.md`.

# Voice AI Receptionist - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | voice-receptionist |
| Name | Voice AI receptionist |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Missed calls are missed orders, and no human can pick up around the clock. This blueprint answers every call with a voice AI that greets the caller, takes messages and books jobs at any hour, and transfers to a human the moment it should. For trades, clinics and service businesses.

## 3. Outcome metrics

- Every call answered, including nights (assumes the AI line never goes to voicemail during configured hours).
- Caller requests captured in structured form (name, phone, request) for 90%+ of answered calls (measured on the calls sheet).
- Jobs booked without a human for simple requests (assumes availability checks against the calendar).
- Missed-call loss recovered within 10 seconds of pickup (measured from call answer to first AI greeting).

## 4. Scope

### 4.1 In scope

- Answer inbound Twilio voice calls via a TwiML webhook.
- Stream the call audio and run a voice AI loop: speech-to-text, dialog generation from a client script, text-to-speech replies.
- Capture caller name, phone and request, and confirm by repeating back.
- Book a job from availability when the request is clear (reuses service 04 patterns).
- Transfer to a human on request, on keywords (agent, human, manager), or outside business hours to the on-call number.
- Log every call with outcome and transcript summary.
- Notify the team on Slack for booked jobs, messages taken and transfers.

### 4.2 Out of scope

- No outbound calling and no robocalling.
- No custom web app UI and no mobile app.
- No payments taken over the phone in v0.1.
- No multi-language support beyond the client's configured language in v0.1.
- No training of a custom voice model: stock TTS voices only.

## 5. Inputs and triggers

Trigger 1: Twilio voice webhook (n8n node: Webhook, POST from Twilio).

```json
{ "CallSid": "CA1234567890abcdef", "From": "+88017XXXXXXXX", "To": "+8801XXXXXXXXX", "CallStatus": "ringing", "Direction": "inbound", "CallerName": "" }
```

Trigger 2: Media stream (websocket) for live audio when using Twilio Media Streams + a realtime model. Not strictly required for a turn-based design that uses recorded segments.

## 6. Workflow design

### 6.1 Main flow

1. Twilio webhook -> n8n responds with TwiML: `<Say>` greeting plus `<Connect><Stream>` to the media stream (or `<Record>` for a turn-based design). Return TwiML within 5 seconds of the webhook.
2. Speech-to-text: Whisper (OpenAI audio API) on the caller's utterance.
3. DeepSeek node "Dialog" (deepseek-chat, temperature 0.3, system prompt = client script + business rules): given the transcript and stage, return intent plus the next reply text. Intents: greeting, message_capture, book_job, transfer, goodbye.
4. Text-to-speech: respond with the generated text, then listen for the next turn. Loop steps 2-4 with a max of 12 turns per call.
5. IF node "Book request?": when intent is book_job, parse service and time, check Google Calendar availability, confirm the slot aloud, create the event, and log the booking.
6. IF node "Transfer?": on the transfer intent, keywords, or outside business hours, TwiML `<Dial>` to the on-call number. Log the transfer target and time.
7. Code node "Finalize call": on hangup, write the call row (call_sid, from, to, started_at, ended_at, duration, outcome, summary) to the calls sheet.
8. Slack node: notify #calls with outcome (booked / message / transferred / abandoned) and the one-line summary.
9. noOp "Done".

### 6.2 Branch logic

- IF "Book request?": booking flow vs continue dialog.
- IF "Slot available?": confirm vs offer the next free slot.
- IF "Transfer?": transfer vs keep the dialog.
- IF "Business hours?": normal script vs after-hours script (same AI, different greeting and transfer rules).

### 6.3 Error handling

- Media stream dropout: fall back to a `<Record>` + Whisper turn-based loop so the call still completes.
- ASR returns empty or garbage: one polite "I did not catch that" retry, then take a message manually.
- LLM latency over 4 seconds: send a `<Gather>`-free "one moment" filler, never dead air.
- Calendar unavailable: take the message and tell the caller a human will call back; never book blindly.
- Transfer fails (line busy): capture the message and alert the team on Slack.
- Hangup mid-flow: finalize with outcome abandoned and whatever data was captured.

### 6.4 Idempotency

- Dedupe on CallSid: every call logs exactly one row, even if Twilio re-posts webhooks.
- Booking creation keyed on (call_sid + slot ISO): a repeated confirm cannot create two events.
- Transfer events logged once per CallSid.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Twilio webhook responses: always return TwiML within 5 seconds; Twilio retries on timeout, dedupe by CallSid handles the rest.
- Model calls: retry once within the turn, then fall back to a scripted default line.

## 7. Data model

Storage: Google Sheets log plus Google Calendar for bookings.

Sheet "calls":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| call_sid | string | CA1234567890 | idempotency key |
| from | string | +88017XXXXXXXX | caller number |
| to | string | +8801XXXXXXXXX | business line |
| started_at | timestamp | 2026-08-11T19:05+06:00 | |
| ended_at | timestamp | 2026-08-11T19:07+06:00 | |
| duration_s | number | 120 | |
| outcome | string | booked | booked, message, transferred, abandoned |
| caller_name | string | Ravi Das | captured by AI |
| request | string | Need a plumber Tuesday | summary |
| transcript | text | ... | full transcript, truncated at 4k chars |
| booking_id | string | BK-1002 | when booked |
| created_at | timestamp | 2026-08-11T19:05+06:00 | |

Naming: sheet named clientname_calls. Calendar event summary prefixed "Call booking". Transcript stored once per CallSid.

## 8. Per-client configuration block

- [ ] Twilio account SID + auth token + business phone number: ...
- [ ] Voice webhook URL (https endpoint on the n8n instance): ...
- [ ] DeepSeek API key + dialog model (default deepseek-chat): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback swappable here): ...
- [ ] Whisper + TTS credentials (OpenAI audio API, used for transcription and voice; there is no DeepSeek audio model): ...
- [ ] Client script and business rules prompt (brand voice, FAQ answers, services, pricing lines): ...
- [ ] Business hours and after-hours behavior: ...
- [ ] On-call transfer number(s): ...
- [ ] Google Calendar credentials + calendar id + services with durations: ...
- [ ] Google Sheets spreadsheet id + calls sheet name: ...
- [ ] Slack webhook + #calls channel: ...
- [ ] Language and TTS voice name: ...
- [ ] Max dialog turns per call (default 12): ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| Twilio voice | $4-8 | 100 calls/month, 3 min average, ~$0.013-0.03/min inbound |
| Audio (Whisper) + DeepSeek dialog | $30-90 | realtime audio is the cost driver: 300 audio-min/month at ~$0.06-0.30/min depending on model choice; Whisper stays for transcription (no DeepSeek audio), DeepSeek handles the dialog |
| Google Calendar / Sheets | $0 | free tier |
| **Total** | **$37-104** | cost driver is the realtime audio model; a turn-based Whisper + TTS design lands near the low end |

Note: this is the most expensive service to run. For price-sensitive clients, prefer the turn-based design (Whisper + chat + TTS) over a realtime streaming model.

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Twilio outage | webhook not received | monitoring job pings the number; Slack alert; number forwards to mobile as fallback |
| Media stream dropout | stream closes mid-call | fall back to Record + Whisper turn-based loop |
| ASR garbage (noise) | confidence low / empty text | one retry, then manual message capture |
| LLM latency | response > 4s | filler "one moment" line, no dead air |
| Calendar conflict during call | availability check fails | offer next free slot or take a message |
| Caller hangs up mid-flow | hangup event | finalize as abandoned, keep captured data |
| Transfer fails (busy) | Dial returns noanswer | capture message, Slack alert |
| Cost spike | minutes above threshold | monthly review of the calls sheet, cap per-call turns |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path call | Dial in, "I need a plumber Tuesday" | Greeting heard, request captured, booked or message taken, call logged |
| Noise test | Dial from a noisy room | One retry max, then message capture, no loop |
| Very short call | Hang up at 2 seconds | Row logged as abandoned, no crash |
| Long call | Keep talking 10+ minutes | Turn cap enforced, call finalizes cleanly |
| Simultaneous calls | 5 concurrent inbound calls | All answered, all logged, no dropped call rows |
| Simulated Twilio outage | Point webhook to bad URL | Slack alert, monitoring detects within 5 min |
| Calendar conflict | Request a booked slot during call | Next-free-slot offered, no double-booking |
| Transfer path | Say "I need to talk to a human" | Call transfers, transfer logged |
| Consistency check | Compare calls sheet rows to Twilio logs | Row count matches CallSid count, one row per call |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflow: none of the demo JSONs cover voice. Reuse the Wait/IF/Slack patterns from public/downloads/lightning-lead-response.json (19 nodes) and the calendar booking patterns from spec 04.
- Twilio Voice: twilio.com/docs/voice (TwiML, <Say>, <Dial>, <Record>, <Stream>, webhook payloads).
- OpenAI audio: platform.openai.com/docs/guides/speech-to-text (Whisper) and text-to-speech. Whisper stays for audio; there is no DeepSeek audio model.
- DeepSeek API: platform.deepseek.com (deepseek-chat for the dialog; DeepSeek pricing, provider swappable per client).
- n8n nodes: Webhook, Code, IF, Switch, Wait, DeepSeek (or model provider), Google Calendar, Google Sheets, Slack.
