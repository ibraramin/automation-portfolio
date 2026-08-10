# Lightning Lead Response - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | lead-response |
| Name | Lightning lead response |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Leads sit cold for hours while competitors answer first. This blueprint scores every inbound lead, drafts a personalized reply, saves it to the CRM and alerts the team on Slack, all within five minutes of arrival. For B2B teams and businesses that run ads.

## 3. Outcome metrics

- Reply in under 5 minutes (measured from webhook receipt to first outbound message or Slack alert).
- 6 hours to <5 minutes average first response (assumes the pipeline runs unattended around the clock).
- 100% of leads logged with a score (assumes every qualifying message reaches the CRM or Airtable row).
- More booked calls from the same ad spend (assumes hot leads get an instant human alert with a ready draft).

## 4. Scope

### 4.1 In scope

- Ingest leads from a web form webhook, a WhatsApp message webhook, and Gmail watch (new mail).
- Score each lead with DeepSeek (deepseek-chat): score 0-10, intent, budget signal, urgency, quantity, buying stage.
- Extract signal chips (urgency, quantity, stage) from the message text.
- Draft a personalized reply from the client's brand voice.
- Upsert the lead into HubSpot (by email) and log it into Airtable.
- Route alerts by score tier: hot (>=8), warm (>=5), cold (<5) to separate Slack channels.
- Auto-send the reply for hot leads; hold warm and cold for humans.
- Send a follow-up reminder on Slack if no human replies within 5 minutes of a hot lead.

### 4.2 Out of scope

- No custom web app UI and no mobile app.
- No lead scoring model training: scoring uses a stock DeepSeek model with a prompt.
- No unsolicited marketing sends: only replies to inbound messages.
- No multi-CRM sync in v0.1: HubSpot plus Airtable log, other CRMs are extension points.
- No scheduling of sales calls: booking belongs to service 04.

## 5. Inputs and triggers

Trigger 1: Lead webhook (n8n node: Webhook, POST).

```json
{ "name": "Sarah Mitchell", "email": "sarah@northpeak.co.uk", "phone": "+447700900123", "message": "We need pricing for 20 branded hoodies by end of month. What's your turnaround?", "channel": "website_form", "source": "google_ads", "receivedAt": "2026-08-11T12:41:00+06:00" }
```

Trigger 2: WhatsApp message (n8n node: Webhook, WhatsApp Cloud API payload). Fields read: `from`, `text.body`, `contacts[0].profile.name`.

Trigger 3: Email (n8n node: Gmail watch). Fields read: `from`, `subject`, `bodyPlain`, `date`.

## 6. Workflow design

### 6.1 Main flow

1. Trigger -> Code node "Normalize Lead": produce a canonical object with message, name, email, phone, channel, source, receivedAt. Fill missing name/email with empty strings, never null.
2. IF node "Is real message?": message length >= 10 characters. Short or empty messages are logged and dropped.
3. DeepSeek node "Score lead" (deepseek-chat, temperature 0). System prompt demands strict JSON: {"score":0-10,"intent":"high|medium|low","budget":"strong|weak|unknown","urgency":"...|none","quantity":"...|unknown","stage":"pricing request|demo request|questions|other","summary":"one sentence"}.
4. Code node "Parse score": extract the JSON between the first `{` and last `}`, clamp score to 0-10, fill defaults for missing keys.
5. Switch node "Route by score": score >= 8 -> output 0 (hot), score >= 5 -> output 1 (warm), else output 2 (cold).
6. Code node "Draft reply": template that references the lead name, quantity, urgency and stage, signed with the client brand.
7. HubSpot node "Upsert contact": operation upsert, match on email, set firstname, phone, hs_lead_status new, plus custom score and stage properties.
8. Airtable node "Log lead": append name, email, phone, message, score, stage, status new.
9. Slack node "Alert": hot -> #leads-hot (score, intent, budget, urgency, quote), warm -> #leads-warm (summary), cold -> #leads-nurture.
10. Hot path: Gmail or WhatsApp node "Send reply" (auto-send the draft). Then Wait node 5 minutes, then Slack node "Follow-up reminder" if nobody posted a reply acknowledgement.
11. Warm path: Wait node 2 hours, then Slack nudge if still unanswered.
12. Cold path: Set node tags the lead for the nurture sequence; no auto-send.
13. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- IF "Is real message?": qualifying vs dropped.
- Switch "Route by score": hot / warm / cold.
- Hot branch: auto-send vs alert-only is a per-client toggle in the config block.

### 6.3 Error handling

- Empty or spam message: dropped at the IF gate, logged with reason.
- Model score failure: fallback score 5 (warm) so the lead is never lost silently; alert on Slack.
- HubSpot upsert failure: still send the Slack alert and log to Airtable; park the contact in a retry queue.
- Slack outage: the reply draft is still stored in the CRM row; a re-delivery job retries the alert.
- Email/WhatsApp send failure: retry once, then leave the draft in the CRM for a human.

### 6.4 Idempotency

- Dedupe on (email + receivedAt minute) for web leads and on message id for WhatsApp.
- HubSpot upsert by email is naturally idempotent: re-processing the same lead updates the same contact.
- Airtable append is guarded by a lead_key column (channel + receivedAt + email hash).

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- DeepSeek and HubSpot calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Outbound messages: retry once, then human fallback.

## 7. Data model

Storage: HubSpot plus Airtable base "leads" as the log. HubSpot is a CRM: the contact database where leads and customers are tracked; any CRM with an API works (the $0-20/mo assumption stays).

Airtable "leads" table:

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| lead_key | string | web-20260811T1241-hash | idempotency key |
| name | string | Sarah Mitchell | |
| email | string | sarah@northpeak.co.uk | HubSpot match key |
| phone | string | +447700900123 | |
| message | string | full text | |
| score | number | 9 | 0-10 |
| intent | string | high | |
| budget | string | strong | |
| urgency | string | end of month | |
| quantity | string | 20 units | |
| stage | string | pricing request | |
| status | string | new | new, replied, held, closed |
| replied_at | timestamp | 2026-08-11T12:42+06:00 | |
| created_at | timestamp | 2026-08-11T12:41+06:00 | |

HubSpot contact properties: firstname, phone, hs_lead_status, plus custom properties nexus_score, nexus_stage, nexus_source. Naming: custom properties prefixed nexus_.

## 8. Per-client configuration block

- [ ] Lead webhook URL(s) from the client's forms: ...
- [ ] WhatsApp number + token (if WhatsApp leads): ...
- [ ] Gmail inbox credentials (if email leads): ...
- [ ] DeepSeek API key + model (default deepseek-chat): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback swappable here): ...
- [ ] Scoring prompt and brand voice for drafts: ...
- [ ] HubSpot access token + custom property names: ...
- [ ] Airtable base id + table name: ...
- [ ] Slack webhooks for #leads-hot / #leads-warm / #leads-nurture / #alerts: ...
- [ ] Outbound reply channel (email or WhatsApp) + sender identity: ...
- [ ] Auto-send toggle for hot leads (true/false): ...
- [ ] SLA threshold for the follow-up reminder (minutes): ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $0.30-1 | 1,000 leads/month, ~1k tokens per lead at deepseek-chat pricing (much lower than OpenAI) |
| HubSpot | $0-20 | free tier for small volumes; paid tier if custom properties quota exceeds. HubSpot is a CRM: the contact database where leads and customers are tracked; any CRM with an API works |
| Airtable | $0 | free tier |
| WhatsApp replies | $1-5 | 100-300 conversations/month, service category |
| **Total** | **$4-32** | at 1,000 leads/month, dependent on HubSpot tier |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Spam or empty lead | message length gate | dropped and logged with reason |
| Model scoring failure | timeout or non-JSON | fallback score 5 (warm), Slack alert |
| Duplicate lead | lead_key or email+minute | upsert instead of duplicate row |
| HubSpot rate limit | 429 | backoff, park in retry queue, alert |
| Slack outage | 5xx on post | draft stored in CRM, retry job re-posts |
| Email/WhatsApp send failure | 5xx or 401 | retry once, leave draft for human |
| Scoring prompt drift | sudden score distribution shift | weekly spot-check, prompt version in config |
| Webhook timeout | provider retries | 200 returned immediately, async processing |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path hot lead | POST the Sarah hoodies payload | Score >= 8, draft created, CRM row, Slack alert, auto-reply sent |
| 10x volume | POST 50 leads in 60 seconds | All logged, no duplicates, p95 first-response < 5 min |
| Empty / malformed | POST `{}` and a 3-char message | Dropped at gate, no crash, no outbound |
| Duplicate event | Re-send same lead twice | One CRM contact, one Airtable row (upsert) |
| Simulated model outage | Invalid API key | Fallback score, Slack alert, lead still logged |
| HubSpot quota | Mock 429 | Backoff + retry queue, Slack alert, data intact |
| Concurrent runs | 10 leads same second | All upserts land, lead_key collisions resolved |
| SLA timing | Measure trigger-to-alert | Alert posted in under 5 minutes 100% of runs |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflow: public/downloads/lightning-lead-response.json (19 nodes). Reuse the normalize step, strict-JSON scoring prompt, score switch, draft template, HubSpot upsert, Airtable log and Slack tiering. Extend with the web/WhatsApp/email trigger set and the follow-up waits.
- DeepSeek API: platform.deepseek.com (deepseek-chat; DeepSeek pricing, provider swappable per client).
- HubSpot API: developers.hubspot.com (contacts API, custom properties).
- Slack incoming webhooks: api.slack.com/messaging/webhooks.
- n8n nodes: Webhook, Gmail Trigger, Code, IF, Switch, Wait, DeepSeek (or model provider), HubSpot, Airtable, Slack, Set.
