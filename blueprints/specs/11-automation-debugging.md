# Automation Debugging and Optimization - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | automation-debugging |
| Name | Automation debugging and optimization |
| Version | v0.1 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Every business running on n8n, Zapier, Make or custom scripts eventually hits a workflow that breaks at the worst moment, runs flakily, or quietly burns money in executions and tokens. This blueprint audits and repairs existing automations: find the root cause, fix it, harden error handling, retries and idempotency, cut execution and token spend, and hand over a runbook the client can actually use. It is positioned as a low-difficulty, high-trust entry service that converts into the larger builds covered by the other ten spec sheets, because debugging and optimization is the top n8n freelance demand category. For founders, ops teams and agencies that no longer trust the automations running their business.

## 3. Outcome metrics

- Root cause identified for every reported failure (assumes each failure is reproducible or has a captured error log).
- Fixed failures stay fixed across a 30-day watch (assumes the weekly monitoring sweep is running).
- Error handling covers every step that can fail (assumes the audit checks all nodes, not just the failing path).
- Execution and token spend drop after the optimization pass (assumes spend baselines are read before any changes).
- Handover runbook accepted by the client (assumes the runbook covers restart, re-run and common failures).

## 4. Scope

### 4.1 In scope

- Diagnostic audit of existing automations: map triggers, nodes, credentials (names only) and failure history.
- Root-cause fixes for broken or flaky behavior, applied on staging first.
- Error handling: Error Workflows, per-node retries, dead-letter rows and Slack alerts.
- Retry and idempotency hardening so re-runs never double-send or double-write.
- Performance and cost reduction: execution time, API calls, token spend and platform quotas.
- Documentation: a handover runbook for the client team.
- A 30-day post-fix watch with a weekly status line.

### 4.2 Out of scope

- No building new automations from scratch: that is a cross-sell to the other ten spec sheets.
- No platform migrations as the main deliverable: offered as an add-on when the audit shows a cheaper or more reliable home.
- No training courses or workshops as the deliverable: the runbook handover covers knowledge transfer.
- No rewriting working automations for style reasons.
- No changes to client production flows without a staging run and explicit sign-off.

## 5. Inputs and triggers

Trigger 1: Client intake form (Google Form or webhook). Payload:

```json
{ "ticket_id": "DBG-001", "business": "Rahim Traders", "platform": "n8n", "symptom": "Orders stop after midnight", "when_started": "2026-07-14", "last_worked": "2026-07-13", "error_log": "staging export available", "access": "staging" }
```

Trigger 2: Error webhook from the client's existing automation (n8n Error Trigger, Zapier catch hook, or Make error module). Payload:

```json
{ "workflow_id": "wf-orders-v3", "node": "Google Sheets", "error": "429 rate limited", "execution_id": "EX-88231", "occurred_at": "2026-07-14T00:03:00+06:00" }
```

Trigger 3: Schedule Trigger for the monitoring sweep: cron `0 7 * * 1` (Asia/Dhaka).

Inputs: read-only access or a staging environment, error log exports, run history, and spend reports (execution counts, model provider usage, platform quotas).

## 6. Workflow design

### 6.1 Main flow

1. Webhook or intake form -> Code node "Normalize intake": ticket_id, platform, symptom, start date, access level.
2. IF node "Access granted?": staging or read-only -> continue; else Slack "#debugging intake" alert and hold.
3. Code node "Snapshot current state": export workflow JSON, credential names (never values), run history, error logs and spend baselines into the audit sheet.
4. Code node "Replay last failures": pull the last N error executions and their input data (IDs only, never secrets).
5. DeepSeek node "Triage summary" (deepseek-chat, temperature 0): classify each failure into a root-cause category and a suspected node. Strict JSON {"fails":[{"id":"EX-88231","category":"rate_limit","confidence":0.9,"suspected_node":"Google Sheets"}]}.
6. DeepSeek node "Deep diagnosis" (deepseek-reasoner, temperature 0, only when confidence is below 0.8 or the category is logic): root-cause hypothesis with evidence and a proposed fix. Strict JSON {"root_cause":"...","evidence":["..."],"proposed_fix":"...","risk":"low|medium|high","test_plan":"..."}.
7. IF node "Confidence high?": 0.8 or above -> direct fix path; else human review path.
8. Fix path: Code node "Apply fix on staging": patch the workflow, keep the original versioned.
9. Code node "Replay test": run the previously failing inputs against the patched workflow.
10. IF node "Tests pass?": pass -> hardening path; fail -> back to diagnosis with the new evidence.
11. Hardening: Code node "Harden": add error handling, retries, idempotency guards and dead-letter rows for every step identified in the audit.
12. IF node "Production rollout?": client signs off after the staging run -> Code node "Deploy to production" (keep the rollback point); no -> hold in staging.
13. Code node "Document runbook": restart, re-run, health checks and common failure signs.
14. Monitoring: Schedule Trigger weekly sweep -> Code node "Watch checks": health checks, replay the fixed scenarios, compare spend baselines.
15. Slack node "#debugging report": weekly status, spend delta, open items.
16. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- Access: granted vs pending (hold with alert).
- Confidence: high (auto fix) vs low (human review).
- Tests: pass vs fail (loop back with new evidence, capped at 3 loops).
- Rollout: signed off vs held in staging.
- Outcome: fixed, escalated, or declined (client chooses not to fix).

### 6.3 Error handling

- Cannot reproduce: capture inputs, ask the client for the next occurrence with logging enabled, watch for it on the sweep.
- Client environment secrets: never read or export credential values; work from staging or masked logs.
- Risky production change: staging first, rollback point kept, explicit client sign-off.
- Platform outage during replay: defer the test, retry on the next run.
- Model failure: fall back to manual diagnosis and alert on Slack.
- Rollback: if a deployed fix regresses, revert to the last known-good version within one hour.

### 6.4 Idempotency

- ticket_id is the dedupe key for intake; a re-submission updates the existing ticket.
- A fix is applied once per workflow version (a version counter on the workflow JSON).
- Replay tests are safe to re-run: the harness uses throwaway rows and test endpoints.
- The weekly watch never re-alerts on the same failure signature within a 7-day window (signature = node + error class).

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- Platform API calls in the audit: retry 3 times, exponential backoff (1s, 5s, 30s).
- The diagnosis loop is capped at 3 iterations, then a human takes over.
- The weekly watch retries failed health checks once, then flags the workflow as degraded.

## 7. Data model

Storage: Google Sheets, one workbook per client, sheet names prefixed with the client slug.

audit sheet (clientname_audit):

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| workflow_id | string | wf-orders-v3 | versioned on every fix |
| platform | string | n8n | n8n, zapier, make, custom |
| ticket_id | string | DBG-001 | intake dedupe key |
| symptom | string | Orders stop after midnight | |
| root_cause | string | Webhook timeout at 2 AM | from diagnosis |
| category | string | timeout | webhook, auth, data, rate_limit, quota, logic |
| confidence | number | 0.9 | |
| status | string | fixed | open, diagnosing, fixed, rolled_back, declined |
| applied_version | string | v3.1 | workflow JSON version |
| test_result | string | pass | |
| spend_before | number | 45 | monthly USD |
| spend_after | number | 22 | monthly USD |
| fixed_at | timestamp | 2026-07-16T10:00+06:00 | |
| created_at | timestamp | 2026-07-14T09:00+06:00 | |

failures sheet (clientname_failures): failure_id, execution_id, node, error_class, occurred_at, signature (node + error class), alert_sent_at. spend_log sheet (clientname_spend_log): month, executions, tokens, api_calls, cost_usd, source. The runbook is delivered as a markdown file per client, not a sheet. Timestamps in the client timezone (default Asia/Dhaka).

## 8. Per-client configuration block

- [ ] Access level: read-only | staging (staging-first for any production change): ...
- [ ] Platform details: n8n URL + API key, Zapier account, Make account, or repo access for custom scripts: ...
- [ ] Workflows in scope (ids or names): ...
- [ ] Failure history source (error log export, n8n executions list, Zapier history): ...
- [ ] Spend sources (execution counts, model provider usage, platform quotas): ...
- [ ] DeepSeek API key + models (deepseek-chat for triage, deepseek-reasoner for deep diagnosis): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Business hours and alert channel for #debugging: ...
- [ ] Rollback rules and sign-off list (who approves a production rollout): ...
- [ ] Watch period in days (default 30): ...
- [ ] Payment channel: bKash-manual | LC/bank (used for retainer billing; retained for template consistency): ...
- [ ] Sheets ids and names: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); debugging often runs on the client's existing n8n instance, so this can be near zero |
| DeepSeek | $1-4 | 20-40 diagnosis passes/month at deepseek-chat and deepseek-reasoner pricing |
| Slack | $0 | free tier |
| **Total** | **$4-10** | for the monitoring watch and internal tooling. The service itself is priced per engagement: diagnostic audit from $300 fixed, simple fixes $800-1,500, complex repairs $1,500-4,000, optional maintenance retainer $200-600/mo, and an hourly option of $40-80/hr for open-ended work |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Cannot reproduce the failure | replay passes on captured inputs | keep logging enabled, ask the client for the next occurrence, watch for it on the sweep |
| Client environment secrets | credential exposure risk | staging-first, masked logs, credential values never exported |
| Risky production change | high-risk flag on the proposed fix | staging run, rollback point, explicit sign-off |
| Regression after deploy | alert on the watch | revert to the last known-good version within one hour |
| Model diagnosis wrong | human review or replay fail | cap at 3 loops then human; evidence attached to every hypothesis |
| Platform API outage | 5xx on audit calls | retry with backoff, defer, alert |
| Token or quota exhaustion | 429 on audit calls | backoff, batch the audit, alert |
| Client has no error history | empty error log | build the monitoring sweep first, then diagnose on real data |
| Scope creep into rebuild | new-build requests | cross-sell to the other ten spec sheets; keep the ticket on fixes only |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path fix | Intake a reproducible failure and run the fix | Root cause identified, fix applied on staging, tests pass |
| Fix under load | Replay the failure while the workflow runs at 10x normal volume | Fix holds, no double sends or double writes |
| Restart resilience | Kill and restart the n8n instance mid-watch | Watch resumes, no lost alerts, no duplicate alerts |
| Idempotent replay | Re-run the failing inputs 3 times | One fixed outcome, no duplicated rows or sends |
| Cannot reproduce | Intake a failure with no captured inputs | Ticket held with monitoring enabled, no false fix |
| Duplicate intake | Submit the same ticket_id twice | One ticket, updated, no duplicate rows |
| Production regression | Deploy a fix that breaks a second flow | Rollback within one hour, alert sent |
| Simulated model outage | Revoke the DeepSeek key mid-diagnosis | Manual fallback path, alert, no crash |
| Spend reduction | Compare spend baselines before and after the optimization pass | Measured drop in executions or tokens, documented |
| Data consistency | Re-run the weekly watch twice | Alert counts unchanged on the second run |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |

## 13. References

- Closest demo n8n workflows: no debugging demo exists in public/downloads/ yet. Reuse the error-handling, retry and idempotency patterns documented across specs/01 to 10 (especially specs/03-lead-response.md and specs/08-prospect-outbound.md) as the starting point for the audit and hardening nodes.
- External docs: n8n Error Workflow and retry nodes (docs.n8n.io), DeepSeek API (platform.deepseek.com), Zapier and Make error documentation, and platform quota pages.
