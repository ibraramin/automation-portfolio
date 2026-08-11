# Blueprint Spec-Sheet Library

This folder is the engineering backbone of Nexus Automations. Every client automation starts as a spec sheet in specs/, gets built into a tested n8n blueprint, and only then becomes a paid client delivery. The sheets are written so that an agent with zero other context can design the full workflow from the sheet alone.

## The workflow: spec, blueprint, stress-test, deliver

1. Spec: a blueprint agent reads the spec sheet and produces a production-grade n8n workflow. Each sheet is self-contained: triggers, payload shapes, node types, branches, error handling, idempotency, data model, cost and stress tests are all specified up front.
2. Blueprint: the built workflow lives as an n8n export JSON, stored per service under blueprints/builds/ (created by the blueprint agent, not this folder).
3. Stress-test: the blueprint is executed against the stress-test matrix in each spec sheet (happy path, 10x volume, malformed inputs, duplicate events, simulated outages, quota exhaustion, concurrent runs, data consistency checks).
4. Learn: every bug, quirk, or full-on mistake encountered during design, build, or stress-test is appended to BUGS-AND-QUIRKS.md (append only, never delete). Read it before starting any new blueprint.
5. Client delivery: a paid delivery is a copy of a v1.0+ tested blueprint plus a filled per-client configuration block. No core-logic changes per client.

## Versioning convention (semver)

- v0.2: draft spec, not yet built or tested. Sheets 01 to 06 are at v0.2 today; sheets 07 to 11 are at v0.1 today.
- v1.0: first tested release. The blueprint passed the full stress-test matrix.
- v1.1, v1.2, ...: client-tuned releases. Version bumps record behavior changes, never client data.

## Per-client configuration isolation rule

Every client-specific value lives in the "Per-client configuration block" section of the spec sheet. A delivery equals a copy of the tested blueprint plus a filled configuration block, deployed as is. Any change that touches core flow logic (branching, node types, error handling, idempotency keys) requires a version bump and a re-run of the stress-test matrix.

## Model strategy

- DeepSeek is the default model provider across all sheets (deepseek-chat for fast and cheap tasks, deepseek-reasoner for complex extraction). DeepSeek pricing is much lower than OpenAI for the same workloads.
- The provider is swappable per client: the model choice lives in the per-client configuration block of each spec sheet, and OpenAI or Anthropic is a documented one-line fallback.
- Audio transcription keeps Whisper (there is no DeepSeek audio model). Voice sheets therefore keep OpenAI audio pricing for Whisper and TTS.

## Payment-channel strategy

- Small orders: manual bKash human-confirm. The customer sends a Transaction ID, the bot validates its format and logs it, then a human confirms the payment in the bKash app within the SLA and the flow posts a Slack confirm. No automated TrxID verification via a public API.
- Large orders: LC (letter of credit) or bank transfer. The workflow supports a manual bank or LC confirmation step with a proof upload before the order is confirmed.
- Each client picks one channel in the per-client configuration block: bKash-manual | LC/bank.

## Suggested build order (easy to hard)

Start with the cheapest wins to build confidence and the bug log, then climb.
Sheet 11 (debugging) has no design blueprint: it is runbook-style and its
lessons accrue through the bug log.

1. specs/09-review-management.md (Low-Med difficulty)
2. specs/04-booking-reminders.md (template-able)
3. specs/06-reporting-ops.md (idempotent week keys)
4. specs/01-omni-capture.md (flagship, well-understood components)
5. specs/03-lead-response.md (reuses 01's funnel)
6. specs/02-doc-processing.md (Medium-High, OCR and vision variance)
7. specs/08-prospect-outbound.md (Medium-High, deliverability rules)
8. specs/10-ecommerce-ops.md (Medium-High, BD courier APIs)
9. specs/07-support-triage.md (HIGH, most underestimated)
10. specs/05-voice-receptionist.md (HIGHEST, realtime audio)

## Index

- TEMPLATE.md: the reusable spec-sheet template. All eleven spec sheets follow it section for section, in the same order, with the same section names.
- BLUEPRINT-PROMPT.md: the one-sheet-one-blueprint prompt. Each run produces a working n8n prototype JSON (builds/), a design document (designs/), and a founder implementation guide (guides/).
- BUGS-AND-QUIRKS.md: the append-only log of every bug, quirk, and full-on mistake encountered while building and stress-testing blueprints. Read it before starting any new blueprint.
- BLUEPRINT-PROMPT.md: the reusable prompt that turns ONE spec sheet into ONE buildable blueprint (one run, one service, never batch).
- BUGS-AND-QUIRKS.md: the append-only log of every bug, quirk, and mistake found while implementing and stress-testing blueprints.
- specs/01-omni-capture.md: order and lead capture across channels.
- specs/02-doc-processing.md: AI document processing.
- specs/03-lead-response.md: lightning lead response.
- specs/04-booking-reminders.md: bookings and no-show recovery.
- specs/05-voice-receptionist.md: voice AI receptionist.
- specs/06-reporting-ops.md: reporting and ops automation.
- specs/07-support-triage.md: AI support triage and ticketing.
- specs/08-prospect-outbound.md: prospect list building and AI outbound.
- specs/09-review-management.md: review management and reputation.
- specs/10-ecommerce-ops.md: e-commerce ops sync.
- specs/11-automation-debugging.md: automation debugging and optimization (audit and repair existing n8n, Zapier and Make setups; entry service that converts into bigger builds).

Each sheet references the closest demo n8n workflow in public/downloads/ as the starting point for the blueprint agent, together with the demo node counts and the external API docs that matter for that service.
