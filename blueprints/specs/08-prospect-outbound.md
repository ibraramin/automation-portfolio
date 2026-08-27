> **Note (2026-08-27 pivot):** This spec is now subsumed by `00-omni-chat-core` unified build. Retained for traceability; see `blueprints/README.md` and `docs/specs/Omni-Unified-Spec.md`.

# Prospect List Building and AI Outbound - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | prospect-outbound |
| Name | Prospect list building and AI outbound |
| Version | v0.1 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Finding qualified prospects and sending cold outreach is a full-time job, and most of it lands in spam. This blueprint builds a list of 1,000 qualified prospects a week from public web sources, researches and scores each one, and sends personalized follow-ups that book meetings. For B2B teams and businesses that run ads or sell high-ticket services, mostly in Europe.

## 3. Outcome metrics

- 1,000 qualified prospects researched per week (assumes Apify scrapers plus enrichment sources run on a daily schedule).
- 3-8% reply rate on cold outreach (assumes deliverability is compliant and the first line is personalized).
- Booked meetings flow into the CRM (assumes the outbound half feeds the same pipeline as service 03).
- No bulk WhatsApp sends: banned in Bangladesh, so email and phone only (assumes the client's market rules are enforced in the config).
- Every bounced or complained address suppressed (assumes the suppressed list is checked on every send).

## 4. Scope

### 4.1 In scope

- Build the prospect list from configurable public sources (Apify actors for directories, Google Maps listings, niche sites).
- Enrich each prospect: company size, industry, country, decision-maker name, email and LinkedIn profile.
- Score each prospect for fit and intent signals with DeepSeek.
- Draft personalized outreach: a research-based first line, a clear offer and a single CTA.
- Run a send sequence: initial email, follow-up 1, follow-up 2, stop on reply or opt-out.
- Track sequence state per prospect and suppress bounced, complained and opted-out addresses.
- Route replies and booked meetings into the 03-lead-response pipeline.

### 4.2 Out of scope

- No bulk WhatsApp senders: banned in Bangladesh, never implemented.
- No scraping of password-protected content or personal data beyond public business profiles.
- No auto-sending beyond the approved sequence steps in the config.
- No phone dialing: call automation is an extension point, not in v0.1.
- No custom web app UI: the pipeline dashboard is a Google Sheets view.
- No list buying: sources are public and consent-compliant.

## 5. Inputs and triggers

Trigger 1: Schedule Trigger (n8n node: Schedule Trigger). Build and enrich daily: cron `0 2 * * *` (Asia/Dhaka). Outbound sends weekdays: cron `0 9 * * 1-5` (client timezone).

Trigger 2: Webhook "Run now" (n8n node: Webhook, POST) with a secret token in the header, used for manual kicks and testing.

Trigger 3: Reply webhook (n8n node: Webhook, POST). Inbound reply or 10DLC SMS reply, fields: `from`, `to`, `subject`, `body`, `messageId`, `inReplyTo`.

## 6. Workflow design

### 6.1 Main flow

1. Schedule Trigger -> Apify node "Scrape source": configured actor and input (niche, country, city), target 1,000 prospects.
2. Code node "Normalize prospects": canonical fields, drop rows without a domain or email, dedupe on email hash.
3. HTTP or Apify node "Enrich": enrich domains (company size, industry, contacts). Budget note: enrichment starts around $2.50 per 1,000 domains.
4. DeepSeek node "Score prospect" (deepseek-chat, temperature 0): strict JSON {"fit":0-10,"intent_signals":["..."],"hook":"specific detail for the first line"}.
5. IF node "Qualified?": fit >= 7 and a valid contact email exists -> include; else move to the low_fit sheet.
6. Code node "Draft outreach": subject and body with the personalized hook, the offer, one CTA, and a CAN-SPAM footer with an unsubscribe link. Strict JSON {"subject":"...","body":"..."}.
7. Code node "Guardrails check": the hook must reference a real detail from enrichment, length limits respected, no fabricated claims. Fail -> back to step 4 with a note.
8. Gmail node "Send": bounded to the daily send cap (default 50 per inbox per day), sequence step initial.
9. Wait node "Follow-up spacing" (default 3 days) -> IF node "Replied or opted out?": reply webhook match -> stop sequence, route to 03-lead-response; else send follow-up 1.
10. Wait node (default 7 days) -> same check -> send follow-up 2 or stop.
11. Code node "Log sequence state": prospect status new / sent / followup1 / followup2 / replied / booked / negative.
12. Code node "Book meeting": on an explicit meeting request, create a Google Calendar event and hand the prospect to the lead pipeline.
13. Slack node "#outbound digest": daily counts of sent, replied, bounced, booked.
14. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- IF "Qualified?": include vs low_fit archive.
- IF "Replied or opted out?": stop and route vs continue the sequence.
- IF "Booked meeting?": calendar event + lead pipeline vs continue.
- Draft guardrails: accept vs re-draft once vs manual review.

### 6.3 Error handling

- Scraper fails or returns empty: retry once, then alert on Slack and reuse the last good list.
- Enrichment rate limit or quota: exponential backoff, process the partial list, alert when over 80% consumed.
- Send failure: retry once, then mark the prospect needs_manual.
- Bounce or spam complaint: add to the suppressed list immediately, stop that prospect's sequence.
- Reply webhook missed: a daily reconciliation sweep checks the inbox for unprocessed replies.
- Quota exhaustion: pause sends, keep the queue, alert.

### 6.4 Idempotency

- Dedupe key: email hash and domain hash; the same domain never enters twice.
- sent_log rows (prospect_id + sequence step + sent_at) prevent double sends even after a re-run.
- The daily send cap is enforced on the sum of sent_log for the day, so re-runs cannot exceed it.
- Reply processing keys on messageId / inReplyTo to avoid double-routing.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Apify and enrichment HTTP calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Sends: retry once, then manual.
- Bounded retry windows keep the sequence spacing intact.

## 7. Data model

Storage: Google Sheets, one workbook per client. Sheet names prefixed with the client slug.

prospects sheet (clientname_prospects):

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| prospect_id | string | PR-501 | primary key |
| domain | string | acme-gmbh.de | dedupe key |
| company | string | Acme GmbH | |
| size | string | 10-50 | |
| industry | string | manufacturing | |
| country | string | DE | |
| contact_name | string | Sarah Müller | |
| contact_email | string | s.mueller@acme-gmbh.de | |
| contact_linkedin | string | linkedin.com/in/sarahmueller | |
| fit_score | number | 8 | 0-10 |
| intent_signals | string | hired 2025; uses Shopify | |
| hook | string | Saw your new line | first-line detail |
| status | string | followup1 | new, sent, followup1, followup2, replied, booked, negative |
| source | string | google_maps | |
| enriched_at | timestamp | 2026-08-11T03:00+06:00 | |
| created_at | timestamp | 2026-08-11T02:00+06:00 | |

sent_log sheet: prospect_id, sequence_step, sent_at, message_id. suppressed sheet: email, reason (bounce, complaint, opt-out). low_fit sheet mirrors prospects but filtered out. Timestamps in the client timezone.

## 8. Per-client configuration block

- [ ] Sources to scrape (niche, countries, directories) + Apify actor ids: ...
- [ ] Apify API token (enrichment from ~$2.50/1k domains): ...
- [ ] DeepSeek API key + model (default deepseek-chat): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Outreach sender inbox(es) + SPF/DKIM/DMARC setup: ...
- [ ] Deliverability channel (10DLC for US SMS, CAN-SPAM compliant email in EU; no WhatsApp): ...
- [ ] Brand voice prompt + personalization rules: ...
- [ ] Sequence spacing (days) + daily send cap (default 50): ...
- [ ] Reply inbox + webhook URL: ...
- [ ] Payment channel: bKash-manual | LC/bank (not used by outbound; retained for template consistency): ...
- [ ] Lead pipeline integration (service 03 webhook or sheet): ...
- [ ] Sheets ids and names: ...
- [ ] Weekly target (default 1,000 prospects): ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| Apify + enrichment | $10-40 | 1,000 prospects/week, enrichment ~$2.50/1k domains plus scraper credits |
| DeepSeek | $2-6 | ~1,500 prospects/week scored and drafted, ~1.5k tokens each at deepseek-chat pricing |
| Email sending (Resend or Postmark) | $10-30 | ~1,000 sends/week, transactional tier |
| **Total** | **$25-82** | at 1,000 prospects/week; project $2,500-5,000 + retainer $500-1,500/mo |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Scraper outage or empty result | zero rows or 5xx | retry once, reuse last good list, Slack alert |
| Enrichment rate limit | 429 | backoff, partial list, alert over 80% quota |
| Deliverability collapse | bounce rate over 5% | pause sends, review sender reputation, alert |
| Spam complaint or opt-out | complaint webhook | instant suppression, sequence stopped |
| Duplicate prospect | domain or email hash | dedupe at normalize, no double send |
| Send quota exhausted | daily cap reached | queue holds, no over-send, alert |
| Credential expiry | 401 on send or enrich | alert, queue held until re-auth |
| Reply webhook missed | reconciliation sweep finds no row | process from inbox, route to pipeline |
| Model outage | timeout or 429 | use last enrichment hook, alert, no fabricated detail |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path | Run "Run now" with a test source | 1,000 normalized, scored, drafted prospects, no duplicates |
| Enrichment failure | Revoke the Apify token mid-run | Partial list processed, alert sent, no crash |
| 10x volume | Point the scraper at a 10k list | All rows normalized, dedupe holds, sends capped |
| Empty source | Scraper returns 0 rows | No sends, alert, last good list reused |
| Duplicate domain | Feed the same domain twice | One prospect row, one send |
| Bounce handling | Mock a bounce webhook | Prospect suppressed, sequence stopped |
| Daily cap | 200 prospects, cap 50/day | Exactly 50 sends, rest queued for next days |
| Reply stops sequence | Send a reply after follow-up 1 | Sequence stops, prospect routed to lead pipeline |
| Data consistency | Re-run the same day | sent_log has no double rows, totals match |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |

## 13. References

- Closest demo n8n workflows: public/downloads/lightning-lead-response.json (19 nodes) for scoring, drafting and CRM routing (the outbound half plugs into it), and public/downloads/spreadsheet-rescue.json (17 nodes) for the normalize and dedupe steps.
- External docs: Apify (docs.apify.com), 10DLC and SMS rules (Twilio: twilio.com/docs/guidelines), CAN-SPAM (ftc.gov), DeepSeek API (platform.deepseek.com), n8n nodes (docs.n8n.io).
