> **Note (2026-08-27 pivot):** This spec is now subsumed by `00-omni-chat-core` unified build. Retained for traceability; see `blueprints/README.md` and `docs/specs/Omni-Unified-Spec.md`.

# Review Management and Reputation - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | review-management |
| Name | Review management and reputation |
| Version | v0.1 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Every completed job is a potential five-star review, but most customers are never asked. This blueprint turns job completion into a review request on Google and Facebook, replies to reviews in Bangla or English, and keeps a reputation dashboard current. For local service businesses in Bangladesh: restaurants, clinics, salons, auto workshops and real estate.

## 3. Outcome metrics

- 60%+ of completed jobs get a review request (assumes the job-completion trigger fires on every finished job).
- Review replies within 24 hours (assumes the daily sweep replies to new reviews on the same day).
- Replies match the reviewer's language, Bangla or English (assumes language detection on every review).
- More five-star reviews (assumes happy customers are asked within hours of the job and unhappy ones get a private recovery message instead).
- Unhappy customers are never asked for a public review (assumes the recovery flag from services 01 and 04 is respected).

## 4. Scope

### 4.1 In scope

- Trigger on job completion from service 01 (orders) or service 04 (bookings) via a completion webhook.
- Send a review request by WhatsApp or SMS with a direct Google or Facebook review link.
- Sweep Google Business Profile and Facebook Pages for new reviews on a daily schedule.
- Draft AI replies in Bangla or English, on-brand and polite; flag negative or offensive reviews for a human.
- Maintain a reputation dashboard sheet: counts by rating, reply status, monthly trend.
- Suppress customers marked unhappy or recovered privately.

### 4.2 Out of scope

- No fake reviews, no review buying, no incentivized reviews: against Google and Facebook policies.
- No custom web app or dashboard UI: the dashboard is a Google Sheets view.
- No reputation monitoring beyond Google and Facebook in v0.1 (Trustpilot and others are extension points).
- No social media content scheduling or posting beyond review replies.
- No review deletion requests: platform policies govern.

## 5. Inputs and triggers

Trigger 1: Webhook "Job completed" (n8n node: Webhook, POST), fired by service 01 or 04. Payload:

```json
{ "order_id": "SN-1042", "customer_name": "Rahim Ahmed", "phone": "88017XXXXXXXX", "channel": "whatsapp", "job_type": "haircut", "completed_at": "2026-08-11T18:00:00+06:00", "unhappy": false }
```

Trigger 2: Schedule Trigger (n8n node: Schedule Trigger) for the review sweep: cron `0 9 * * *` (Asia/Dhaka).

Auth inputs: Google Business Profile service account, Facebook Pages access token.

## 6. Workflow design

### 6.1 Main flow

1. Webhook -> Code node "Normalize job": order_id, customer_name, phone, channel, job_type, completed_at, unhappy flag.
2. IF node "Eligible for review request?": phone present, channel supports WhatsApp or SMS, customer not suppressed, not already requested.
3. IF node "Unhappy customer?": the unhappy flag is true -> private recovery path; else the review request path.
4. Recovery path: WhatsApp node "Recovery message": ask what went wrong privately, log the outcome, never send a review link.
5. Review request path: Code node "Select review link": Google place id or Facebook page id from config, plus a short direct link.
6. WhatsApp node or SMS node "Send review request": template message with the link, sent within 24 hours of completion (config window).
7. Code node "Log request": request_log row with order_id, link_sent_at, channel.
8. Schedule Trigger -> Google Business Profile node "List new reviews" and Facebook Pages node "List new reviews": fetch reviews published since the last sweep.
9. Code node "Normalize reviews": author, rating, text, platform, review_id, published_at.
10. DeepSeek node "Draft reply" (deepseek-chat, temperature 0.3): detect language (Bangla or English), strict JSON {"language":"bn|en","reply":"..."} in the brand voice, polite, no invented facts.
11. IF node "Needs human?": rating <= threshold (default 3) or offensive language -> Slack alert path; else auto-post path.
12. Auto-post: Google Business Profile or Facebook Pages node "Post reply".
13. Human path: Slack node "#reviews alert" with the review and the suggested reply; a human edits and posts, or the flow posts on approval via a webhook callback.
14. Code node "Update dashboard": reviews sheet plus a summary tab (totals by rating, pending replies, monthly counts).
15. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- IF "Eligible?": request vs skip (logged with reason).
- IF "Unhappy?": private recovery vs public request.
- IF "Needs human?": auto-post vs human approval.
- Platform split: Google vs Facebook review sources.

### 6.3 Error handling

- Google or Facebook API outage: skip the sweep, retry on the next run, mark pending.
- Reply send failure: retry once, then flag the reply as pending in the dashboard.
- Missing phone or channel: skip the request, log the reason.
- Duplicate review_id: ignored.
- Model outage: use a stored polite template in the client's primary language and alert on Slack.
- Offensive or policy-flagged review: always human, never auto-reply.

### 6.4 Idempotency

- review_id is the dedupe key across sweeps; a review is replied to once.
- request_log keys on order_id: a re-fired completion webhook cannot double-request.
- The recovery path logs a recovery_id, and the same customer is never asked afterwards.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Platform API calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Sweeps are idempotent and safe to re-run after an outage.
- Review requests: sent once per order by the request_log guard.

## 7. Data model

Storage: Google Sheets, one workbook per client. Sheet names prefixed with the client slug.

reviews sheet (clientname_reviews):

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| review_id | string | AbC123xyz | dedupe key |
| platform | string | google | google, facebook |
| order_id | string | SN-1042 | source job |
| author | string | Rahim Ahmed | |
| rating | number | 5 | 1-5 |
| text | string | Great service | |
| language | string | en | bn, en |
| status | string | replied | new, replied, flagged, ignored |
| reply_text | string | ... | AI or human reply |
| replied_at | timestamp | 2026-08-11T10:30+06:00 | |
| published_at | timestamp | 2026-08-10T20:00+06:00 | |
| created_at | timestamp | 2026-08-11T09:00+06:00 | |

request_log sheet: order_id, customer, phone, channel, link_sent_at, recovery_flag. dashboard tab: computed counts by rating, pending replies, monthly trend. Timestamps in the client timezone (default Asia/Dhaka).

## 8. Per-client configuration block

- [ ] Google Business Profile place id(s) + service account: ...
- [ ] Facebook Pages access token + page id(s): ...
- [ ] WhatsApp number + template message id for review requests (or SMS provider): ...
- [ ] Job-completion webhook from service 01 or 04 (order/booking source + sheet): ...
- [ ] DeepSeek API key + model (default deepseek-chat): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Brand voice prompt for replies: ...
- [ ] Human threshold (ratings at or below this go to a human, default 3): ...
- [ ] Suppressed customer list (never request): ...
- [ ] Recovery-message rules (which statuses count as unhappy): ...
- [ ] Review request window in hours (default 24): ...
- [ ] Payment channel: bKash-manual | LC/bank (not used by reviews; retained for template consistency): ...
- [ ] Sheets ids and names: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $0.30-1 | 500 review replies and 300 request drafts/month at deepseek-chat pricing |
| WhatsApp | $1-5 | 200 review-request conversations/month, service category |
| **Total** | **$5-12** | at 500 reviews/month; build $1,000-2,500 + retainer $300-800/mo. Reputation SaaS starts at $10-29/mo per seat, so sell the integration into existing flows, not the dashboard alone |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Google API outage | 5xx or empty list | skip sweep, retry next run, mark pending |
| Facebook token expiry | 401 on fetch | alert on Slack, queue until re-auth |
| Duplicate review | review_id already logged | ignored, replied once |
| Negative review missed | rating threshold logic | ratings <= threshold always go to a human |
| Request to suppressed customer | suppressed list check | skipped and logged |
| WhatsApp send failure | 5xx or window closed | retry once, log, alert |
| Model reply off-brand | guardrail or human review | edit and repost, alert on pattern |
| Sweep rate limit | 429 | backoff, next sweep catches up |
| Offensive review | language filter | human only, never auto-reply |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path request | Fire the completion webhook for a happy customer | Review link sent within 24h, request_log row exists |
| Recovery path | Fire completion with unhappy true | Recovery message sent, no review link, no public ask |
| Happy path reply | Post a 5-star review to the test place/page | AI reply posted within 24h in the right language |
| Negative review | Post a 2-star review | Flagged to human, no auto-reply |
| 10x volume | Fire 300 completion webhooks | All logged, each requested at most once |
| Duplicate review | Post the same review_id twice | One reply, one row |
| Platform outage | Revoke both tokens | Sweep skipped, alerts sent, no crash |
| Language mix | Post reviews in Bangla and English | Each reply matches the review language |
| Data consistency | Re-run the sweep twice | Dashboard counts unchanged on second run |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |

## 13. References

- Closest demo n8n workflows: public/downloads/whatsapp-order-bot.json (26 nodes) for WhatsApp template sends and order-row patterns, and public/downloads/spreadsheet-rescue.json (17 nodes) for the dashboard normalize and dedupe steps.
- Integration edge: job-completion triggers from specs/01-omni-capture.md and specs/04-booking-reminders.md.
- External docs: Google Business Profile API (developers.google.com/my-business), Facebook Graph API reviews (developers.facebook.com/docs/graph-api), WhatsApp templates, DeepSeek API (platform.deepseek.com), n8n nodes (docs.n8n.io).
