# AI Support Triage and Ticketing - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | support-triage |
| Name | AI support triage and ticketing |
| Version | v0.1 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Support requests arrive on email and WhatsApp and pile up while the team works on everything else. This blueprint answers every support message in minutes, resolves 60-70% of them automatically from the client's knowledge base, and escalates the rest to the team with a drafted reply and full context. For service businesses with a WhatsApp inbox in Bangladesh (Bangla and Banglish) or an email support inbox in Europe.

## 3. Outcome metrics

- Reply in under 5 minutes (measured from message receipt to first response, automated or human).
- 60-70% of tickets resolved without a human (assumes a maintained knowledge base of 50+ Q&A entries).
- Escalated tickets arrive with a drafted reply and full context (assumes retrieval finds the relevant articles).
- Replies match the customer's language, Bangla or English (assumes language detection runs on every message).
- No support message left unseen (assumes every ticket row ends in auto_resolved, replied or closed, never lost).

## 4. Scope

### 4.1 In scope

- Ingest support messages from email (Gmail watch or IMAP poll) and the WhatsApp Cloud API webhook.
- Classify intent, detect language and rank priority for every message.
- Retrieve answers from the client knowledge base (Google Sheets source, scored by similarity).
- Auto-resolve when retrieval confidence and answer guardrails pass; reply in the customer's language.
- Escalate otherwise: a drafted reply, retrieved context and the full conversation go to the team on Slack.
- One ticket per conversation thread, with a status lifecycle and a resolution log.
- Out-of-hours auto-acknowledgement on WhatsApp (template message) when the client has business hours set.

### 4.2 Out of scope

- No custom web app UI and no customer portal.
- No phone-call support: voice belongs to service 05.
- No model training: scoring and drafting use stock DeepSeek models plus retrieval.
- No payment handling inside support tickets.
- No bulk WhatsApp messaging: replies only, within the conversation window.
- No multi-platform support inboxes beyond email and WhatsApp in v0.1.

## 5. Inputs and triggers

Trigger 1: Email (n8n node: Gmail Trigger or EmailReadImap). Fields read: `from`, `to`, `subject`, `bodyPlain`, `date`, `messageId`, `attachments[].filename`.

Trigger 2: WhatsApp Cloud API webhook (n8n node: Webhook, POST). Fields read:

```json
{ "object": "whatsapp_business_account", "entry": [ { "changes": [ { "value": { "contacts": [ { "profile": { "name": "Rahim Ahmed" }, "wa_id": "88017XXXXXXXX" } ], "messages": [ { "from": "88017XXXXXXXX", "id": "wamid.ABC123", "timestamp": "1754869200", "type": "text", "text": { "body": "amar order ta kothay?" } } ] } } ] } ] }
```

Trigger 3 (optional): support web form webhook (n8n node: Webhook). Fields: `name`, `email`, `message`, `priority`.

## 6. Workflow design

### 6.1 Main flow

1. Trigger -> Code node "Normalize message": canonical ticket object with channel, thread_id (Gmail messageId or WhatsApp thread), customer name and id, message text, receivedAt.
2. IF node "New or existing thread?": matches a processed message id or open ticket -> route to the existing thread; else create a new ticket.
3. Google Sheets node "Upsert ticket": create or update the ticket row (status open, priority pending).
4. DeepSeek node "Classify" (deepseek-chat, temperature 0): strict JSON {"category":"billing|product|order|technical|other","priority":"high|medium|low","language":"bn|en","sentiment":"positive|neutral|negative"}.
5. Code node "Retrieve": read the knowledge base sheet, score each Q&A entry against the message (keyword overlap plus embedding similarity if a vector store is configured), return the top 3 entries with scores.
6. IF node "Retrieval confidence high?": top score >= threshold from config (default 0.7) -> auto-resolve path; else escalate path.
7. Auto-resolve: DeepSeek node "Draft answer" (deepseek-chat for simple questions, deepseek-reasoner for complex ones): the answer must be grounded in the retrieved articles, written in the customer's language, and end with a clear next step. Output strict JSON {"answer":"...","article_ids":["..."]}.
8. Code node "Guardrails check": the answer must quote or reference at least one retrieved article, contain no hallucinated names or numbers, and respect a length limit. Pass -> send; fail -> escalate.
9. WhatsApp node or Gmail node "Send answer": send within the conversation window; store the message id.
10. Google Sheets node "Resolve ticket": status auto_resolved, resolution_id, resolved_at.
11. Escalate path: Code node "Context bundle": ticket, top retrieved articles, suggested answer, language, priority.
12. Slack node "Escalation alert" #support: ticket id, customer, category, priority, suggested answer, SLA due time.
13. Wait node "SLA timer" (default 30 minutes): if no human approval within the SLA, a second Slack alert fires.
14. Human-in-the-loop: Slack message action or webhook approves or edits the draft; on approval the WhatsApp or Gmail node "Send approved reply" sends it and the ticket closes.
15. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- IF "New or existing thread?": new ticket vs continue existing thread.
- IF "Retrieval confidence high?": auto-resolve vs escalate (threshold in config).
- IF "Guardrails pass?": send vs escalate.
- Escalation approval: approve and send vs edit (human returns corrected text).

### 6.3 Error handling

- Empty or unreadable message: dropped at normalization, logged with reason, no outbound send.
- Model outage or non-JSON output: escalate with the original message, never invent an answer.
- Retrieval returns nothing: escalate with the raw message and no suggested answer.
- Image attachment: OCR via tesseract.js fallback or a vision-capable DeepSeek variant; if unreadable, note it in the context bundle.
- Send failure (WhatsApp window closed, Gmail 5xx): retry once, then park the ticket as needs_manual and alert on Slack.
- Language detection fails: default to the client's primary language from config.

### 6.4 Idempotency

- WhatsApp message id and Gmail messageId are stored in the processed_msg_ids column; repeats are ignored.
- One ticket per thread_id; re-processing a thread updates the existing row.
- Auto-resolve writes a resolution_id once; a re-run of the same message cannot create a second ticket.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- DeepSeek calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Outbound sends: retry once, then human fallback.
- Platform polling (Gmail/WhatsApp) is idempotent, so missed executions re-run safely.

## 7. Data model

Storage: Google Sheets, one workbook per client. Sheet names prefixed with the client slug.

tickets sheet (clientname_support_tickets):

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| ticket_id | string | TK-1024 | primary key |
| channel | string | whatsapp | whatsapp, email, web |
| thread_id | string | 88017XXXXXXXX-1754869200 | dedupe key |
| customer_name | string | Rahim Ahmed | |
| customer_contact | string | 88017XXXXXXXX | phone or email |
| message | string | amar order ta kothay? | full text |
| language | string | bn | bn, en |
| category | string | order | |
| priority | string | high | |
| status | string | auto_resolved | new, auto_resolved, escalated, replied, closed |
| confidence | number | 0.82 | retrieval score |
| article_ids | string | KB-01;KB-14 | used sources |
| auto_answer | string | ... | draft or sent answer |
| final_answer | string | ... | human-approved answer |
| sla_due_at | timestamp | 2026-08-11T10:30+06:00 | |
| resolved_at | timestamp | 2026-08-11T10:05+06:00 | |
| processed_msg_ids | string | wamid.ABC123 | idempotency log |
| created_at | timestamp | 2026-08-11T10:00+06:00 | |

Knowledge base sheet (clientname_kb): article_id, question, answer, keywords, language, updated_at. Timestamps stored in the client timezone (default Asia/Dhaka).

## 8. Per-client configuration block

- [ ] WhatsApp number + token (Bangladesh inbox) and/or Gmail inbox credentials (Europe email): ...
- [ ] Support web form webhook URL (if used): ...
- [ ] DeepSeek API key + models (deepseek-chat default, deepseek-reasoner for complex questions): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Knowledge base source (sheet id) + retrieval threshold (default 0.7): ...
- [ ] Brand voice prompt for answers: ...
- [ ] Auto-resolve toggle (true/false) + guardrail length limit: ...
- [ ] Escalation Slack channel + SLA minutes (default 30): ...
- [ ] Business hours + out-of-hours auto-acknowledge template: ...
- [ ] Support categories list: ...
- [ ] WhatsApp template message id for out-of-hours acknowledgement: ...
- [ ] Payment channel: bKash-manual | LC/bank (not used by support flow; retained for template consistency): ...
- [ ] Sheets ids and names: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $1-4 | 1,000 tickets/month, ~2k tokens per ticket (classify + retrieve + draft) at deepseek-chat pricing |
| WhatsApp | $3-15 | 500 conversations/month, service category, current rates |
| Gmail / Google | $0 | free tier |
| **Total** | **$7-25** | at 1,000 tickets/month; project $3,000-8,000 + retainer $500-1,500/mo |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| WhatsApp or Gmail outage | 5xx or timeout | retry once, park ticket as needs_manual, Slack alert |
| Model outage or rate limit | timeout or 429 | escalate with raw message, never invent an answer |
| Retrieval empty | zero KB matches | escalate without suggested answer |
| Low retrieval confidence | score below threshold | escalate with top-3 candidates for the human |
| Duplicate message | processed msg id seen | ignored, no second ticket |
| Hallucinated answer | guardrail fails (no article reference) | escalate instead of sending |
| Credential expiry (WhatsApp token, Gmail OAuth) | 401 on send or poll | alert on Slack, tickets held in queue until re-auth |
| Webhook timeout | provider retries | 200 returned immediately, async processing |
| Quota exhaustion | 429 on model or sheets | backoff, queue, alert |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path auto-resolve | Send a support message that matches a KB article | Auto-answer sent, ticket auto_resolved, row complete |
| Happy path escalate | Send an ambiguous message | Escalated with draft + context, Slack alert within 1 minute |
| 10x volume | Send 500 messages in 10 minutes | All tickets logged, no duplicate tickets, p95 first-response under 5 min |
| Malformed / empty input | Send `{}` and an empty text message | Dropped at gate, no crash, no outbound |
| Duplicate event | Re-send the same message id twice | One ticket, one resolution |
| Simulated model outage | Invalid API key | Every message escalates with raw text, Slack alerted |
| Retrieval low confidence | Message with no KB match | Escalated, no auto-answer sent |
| SLA timing | Measure trigger to alert | Escalation alert under 5 minutes 100% of runs |
| Concurrent runs | 20 messages same second | One ticket each, processed_msg_ids all recorded |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |

## 13. References

- Closest demo n8n workflows: public/downloads/email-triage.json (22 nodes) for email triage and the human-approval loop, and public/downloads/whatsapp-order-bot.json (26 nodes) for WhatsApp intake and template sends. Reuse the normalize step, classification prompt, HITL approval card and ticket row pattern.
- RAG extraction pattern: reuse the document-extraction and validation approach from specs/02-doc-processing.md.
- Dialog agent patterns (language handling, turn limits): reuse from specs/05-voice-receptionist.md.
- External docs: WhatsApp Cloud API (developers.facebook.com/docs/whatsapp), Gmail API (developers.google.com/gmail), DeepSeek API (platform.deepseek.com), n8n nodes (docs.n8n.io).
