# [Service name] - Blueprint Spec Sheet

> Fill every section below. Do not remove sections. Do not reorder them. A blueprint agent will build the workflow from this sheet alone, so every claim must be concrete: real node names, real parameter names, real column names, real numbers. If a value is client-specific, put it in section 8, never in the flow logic.

## 1. Header

| Field | Value |
| --- | --- |
| Service id | [slug from components/site/services-data.ts] |
| Name | [service title from services-data.ts] |
| Version | v0.2 |
| Status | draft |
| Date | [YYYY-MM-DD] |
| Owner | Nexus Automations |

## 2. Summary

2-3 sentences. Restate the pain and the audience from services-data.ts, then say what this blueprint automates in one sentence. Example: "Orders and leads arrive on WhatsApp, web forms, Messenger and email, and replies slip through the cracks. This blueprint collects every channel into one inbox, answers instantly with what customers ask for, and hands hot conversations to the team. For [audience]."

## 3. Outcome metrics

Measurable before/after promises, using the site's typical-results framing. No fabricated client numbers. One bullet per metric, format "before -> after (assumption behind it)". Examples:

- Replies within 5 minutes (measured from trigger to first outbound message).
- 10+ hours saved weekly (assumes 4 hours of manual data entry per week per staff member).
- [Another metric with its assumption.]

## 4. Scope

### 4.1 In scope

What the blueprint MUST do. Bullet list, concrete and testable.

### 4.2 Out of scope

What it must NOT do. Explicit negatives: no custom web app UI, no mobile app, no payment execution, no unsupported channels, etc.

## 5. Inputs and triggers

For every trigger: the trigger type (Webhook, Gmail watch, IMAP poll, schedule cron, WhatsApp Cloud API webhook, Twilio voice webhook), the n8n trigger node, and the exact payload shape.

- Webhook: JSON schema or literal example with every field the flow reads.
- Form / email / WhatsApp: field list.
- Schedule: cron expression, timezone, weekday rules.

## 6. Workflow design

Numbered steps of the main flow. Each step names the n8n node type and the key parameters. Include branch logic, error handling at each step, idempotency and retry policy.

### 6.1 Main flow

1. Trigger -> node type -> parameters.
2. Every step to completion, in order.

### 6.2 Branch logic

Which IF / Switch nodes exist, what condition, and which output path each takes.

### 6.3 Error handling

Per step: what can fail, what the flow does (return a safe default, route to a review branch, alert on Slack).

### 6.4 Idempotency

How duplicate events are detected and suppressed. Use message ids, invoice numbers, booking ids, weekly job ids, call sids.

### 6.5 Retry policy

n8n error workflow + alert channel. Per-node retry settings and backoff schedule.

## 7. Data model

Every field stored, the storage choice (Google Sheets columns, Supabase table, Airtable base), and naming conventions.

| Field | Type | Example | Notes |
| --- | --- | --- | --- |

Storage and naming conventions paragraph: sheet/table/base names, column order, key fields, timezone for timestamps.

## 8. Per-client configuration block

Every client-specific value, as a fill-in-the-blank list. A delivery equals filling this block plus deploying, nothing else.

- [ ] WhatsApp number / phone number ID: ...
- [ ] Payment channel: bKash-manual | LC/bank (pick one, used by the order-path branch): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Credentials (which ones): ...
- [ ] Sheet IDs and names: ...
- [ ] Brand voice prompt: ...
- [ ] Business hours: ...
- [ ] Product / service catalog: ...
- [ ] ... (anything else client-specific)

## 9. Cost model

Realistic monthly estimate in USD with explicit assumptions.

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $x-y | z runs/day, tokens per run, deepseek-chat or deepseek-reasoner; provider swappable per client |
| WhatsApp | $x-y | n conversations/month, per-category fees |
| Other | $x-y | ... |
| **Total** | **$x-y** | ... |

## 10. Failure modes and mitigations

At least 6 rows. Each: what fails, how it is detected, what the flow does about it.

| Failure mode | Detection | Mitigation |
| --- | --- | --- |

Include: API outage, invalid input, duplicate event, quota exhaustion, credential expiry, webhook timeout, plus service-specific failures.

## 11. Stress-test criteria

Executable matrix. Each row: scenario, test payload or steps, expected result with a pass/fail threshold. The founder runs these after the blueprint is built.

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |

Include: happy path, 10x volume, malformed/empty inputs, duplicate events, simulated API outage, quota exhaustion, concurrent runs, data consistency check.

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | [YYYY-MM-DD] | Initial draft |

## 13. References

- Closest demo n8n workflow: public/downloads/[file].json ([n] nodes). What to reuse and what to extend.
- External docs: n8n node docs, WhatsApp Cloud API, bKash merchant API, Twilio, DeepSeek API pricing. Exact links or doc names.
