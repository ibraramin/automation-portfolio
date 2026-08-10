# Reporting and Ops Automation - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | reporting-ops |
| Name | Reporting and ops automation |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Metrics live in messy spreadsheets, and reports take a whole afternoon to assemble. This blueprint turns raw data into branded reports, rescues messy spreadsheets and turns meeting recordings into minutes. For founders, agency leads and operations teams.

## 3. Outcome metrics

- Weekly report assembled in under 10 minutes (measured from schedule trigger to distribution).
- A week of spreadsheet cleanup to one upload (assumes the cleaning pipeline handles the common dirty patterns).
- 2 hours of meeting notes to 5 minutes of reading (assumes every meeting recording produces minutes with action items).
- 10+ hours saved weekly (assumes one staff member previously did reporting and cleanup by hand).

## 4. Scope

### 4.1 In scope

- Collect metrics from configured source sheets, CSVs and exports on a weekly schedule.
- Clean and normalize raw data: schema suggestion, dedupe, standardization, validation.
- Generate a branded report (markdown or HTML) with an AI-written summary, highlights and action items.
- Distribute the report to Slack, a Notion page and an email list.
- Archive every generated report in a reports log sheet.
- On demand: rescue a pasted messy CSV (reuses the spreadsheet-rescue flow).
- On demand: transcribe a meeting recording or transcript and post minutes with owner-assigned action items (reuses the meeting-minutes flow).

### 4.2 Out of scope

- No custom web app UI and no mobile app.
- No live dashboards or chart rendering: reports are static documents.
- No source-system writes: the pipeline reads source sheets and never modifies them.
- No alerting on metric thresholds in v0.1 (documented extension point).
- No real-time meeting transcription streaming: turn-based processing only.

## 5. Inputs and triggers

Trigger 1: Schedule (n8n node: Schedule Trigger). Weekly report: cron `0 8 * * 1` (Monday 08:00), timezone per client. Configurable day and time.

Trigger 2: On-demand report (n8n node: Webhook, POST, secret token header).

```json
{ "token": "SECRET_TOKEN", "force": false }
```

Trigger 3: Messy CSV rescue (n8n node: Webhook, POST with CSV text).

```json
{ "csv": "Name,Email,Company,Signup Date,Amount\njohn smith,john@acme.com,Acme,01/05/2026,150\nJOHN SMITH,john@acme.com,ACME Inc,May 1 2026,150" }
```

Trigger 4: Meeting upload (n8n node: Webhook or Gmail watch with attachment). Fields: `title`, `fileUrl` or binary attachment, optional `text` transcript.

## 6. Workflow design

### 6.1 Main flow

1. Schedule Trigger -> Code node "Collect sources": read each configured source (Google Sheets node "Read range", CSV fetch, or exported file). Merge into one normalized dataset with a source tag per row.
2. Code node "Normalize": schema mapping, dedupe by a key per dataset, date and number standardization. Output a clean table plus a stats object (rows in, rows removed, warnings).
3. Code node "Compute metrics": derive the configured KPIs (totals, counts, averages) per the client metric definitions.
4. DeepSeek node "Summarize" (deepseek-chat, temperature 0.2; deepseek-reasoner for heavier analysis): system prompt describes the client, metric definitions and tone. User message contains the computed metrics table. Returns a summary, 3-5 highlights and 2-3 action items as strict JSON.
5. Code node "Render report": build the branded document (markdown or inline HTML) from the template, injecting the metrics, summary and highlights.
6. Distribution: Slack node posts the summary to the reports channel with the report text; Notion node creates or updates a report page (database id from config); Gmail node emails the report to the configured list.
7. Google Sheets node "Archive": append a row to the reports log (week_start, week_end, report_url or text, generated_at, status).
8. noOp "Done".

Messy CSV rescue flow (on demand): Webhook -> clean (dedupe, normalize) -> validation -> clean table reply -> append to a clean CSV sheet -> Slack notify. Reuses the spreadsheet-rescue demo logic.

Meeting minutes flow (on demand): Webhook -> IF has transcript/audio -> transcribe (Whisper placeholder) -> DeepSeek extract minutes (title, decisions, action items with owners) -> validate action items -> post to Notion page + Slack #minutes -> archive row. Reuses the meeting-minutes demo logic.

### 6.2 Branch logic

- IF "Week already reported?": the weekly job id (ISO year-week) must not already exist in the reports log, otherwise skip (idempotency).
- IF "Source data empty?": produce a "no data this week" report instead of failing.
- IF "Action items complete?": minutes with missing owners route to a review hold, not to distribution.
- Report distribution per channel can be toggled in config.

### 6.3 Error handling

- Source sheet schema change: validation step reports mismatched headers to Slack and stops before the report is generated, so a bad report is never sent.
- Empty source: emit the "no data" report, do not fabricate numbers.
- Model failure: retry once, then send the raw metrics table without the AI summary, and alert.
- Distribution partial failure: each channel is independent; failures are retried, then logged in the reports row status.
- Oversized report: truncate the AI summary field at a config limit, keep the metrics table intact.

### 6.4 Idempotency

- Weekly job id = ISO year-week (e.g., 2026-W33) stored in the reports log. A re-run for the same week skips generation.
- Meeting minutes dedupe on the recording id or file name hash.
- CSV rescue dedupe on the row keys (email) so re-submitting the same export does not double-append.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Google Sheets, Notion, Slack, Gmail calls: retry 3 times, exponential backoff (1s, 5s, 30s).
- Weekly report missed (downtime): the schedule trigger runs again next day; the week guard still prevents duplicates.

## 7. Data model

Storage: source sheets (read-only), reports log sheet, clean CSV sheet, minutes sheet.

Sheet "reports_log":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| week_start | date | 2026-08-10 | idempotency key with week_end |
| week_end | date | 2026-08-16 | |
| report_summary | text | ... | AI summary |
| report_url | string | https://... | where hosted, optional |
| channels | string | slack;notion;email | which succeeded |
| status | string | sent | sent, partial, failed |
| generated_at | timestamp | 2026-08-11T08:00+06:00 | |

Sheet "cleaned_exports": the output of every CSV rescue, one row set per run with a run_id column.

Sheet "minutes":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| title | string | Q3 launch sync | |
| date | date | 2026-08-11 | |
| decisions | text | ... | |
| actions | text | Owner: task (deadline) | |
| summary | text | ... | |
| recording_id | string | rec-2026-08-11a | dedupe key |
| created_at | timestamp | 2026-08-11T14:04+06:00 | |

Naming: sheets prefixed with the client slug. Week numbers use ISO 8601 year-week.

## 8. Per-client configuration block

- [ ] Source sheet ids + ranges and column mappings: ...
- [ ] Metric definitions (which KPIs, how computed): ...
- [ ] Brand colors, logo and report template: ...
- [ ] Report schedule (day, time, timezone): ...
- [ ] Slack webhook + reports channel: ...
- [ ] Notion integration token + database id: ...
- [ ] Email report recipients: ...
- [ ] DeepSeek API key + model (default deepseek-chat) and report prompt: ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback swappable here): ...
- [ ] CSV rescue webhook path + secret token: ...
- [ ] Meeting recording inbox / webhook + Whisper credentials: ...
- [ ] Reports log spreadsheet id + sheet names: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $0.50-2 | 4 weekly reports/month (~2k tokens each) + 20 meeting minutes/month at deepseek-chat pricing (much lower than OpenAI) |
| Google Sheets / Gmail | $0 | free tier |
| Notion | $0 | free tier |
| **Total** | **$4-8** | at 4 weekly reports + 20 meetings/month |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Source schema change | header mismatch in validation | stop before generation, alert with diff, never send a bad report |
| Empty source data | zero rows collected | emit "no data this week" report |
| AI summary hallucination | numbers contradict metrics table | summary is generated from the computed metrics only; raw table always included |
| Duplicate week run | week id in reports log | skip silently |
| Slack or Notion outage | 5xx on post | independent channel retries, partial status logged |
| Email send failure | Gmail 5xx | retry, mark status partial, alert |
| Oversized report | length guard | truncate summary, keep metrics table |
| Credential expiry | 401 on any call | Slack alert, report held until refreshed |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path weekly run | Trigger schedule with 2 source sheets | Report generated, all channels receive it, log row appended |
| 10x data volume | Feed 100k rows into the source | Clean and summarized under 5 minutes, no truncation bugs |
| Empty source | Point config at an empty sheet | "No data" report, no fabricated numbers |
| Malformed rows | Insert broken rows (nulls, bad dates) | Normalization flags them, report still valid |
| Duplicate week run | Re-trigger the same week | Skipped, one log row |
| Simulated Slack outage | Invalid webhook | Retries, partial status, data intact |
| Schema change | Rename a source column | Flow halts before generation with a clear alert |
| CSV rescue | POST the messy sample export twice | Cleaned table returned, one appended row set total |
| Meeting minutes | Upload a sample transcript | Minutes posted with owners, dedupe on recording id |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflows: public/downloads/spreadsheet-rescue.json (17 nodes) for the cleaning pipeline, and public/downloads/meeting-minutes-bot.json (16 nodes) for the minutes flow. Combine both behind the schedule and webhook triggers.
- DeepSeek API: platform.deepseek.com (deepseek-chat and deepseek-reasoner; DeepSeek pricing, provider swappable per client). Whisper stays for audio transcription.
- Notion API: developers.notion.com (database pages).
- Slack incoming webhooks: api.slack.com/messaging/webhooks.
- n8n nodes: Schedule Trigger, Webhook, Google Sheets, Code, IF, DeepSeek (or model provider), Slack, Notion, Gmail, Set.
