# Bugs, Quirks and Mistakes Log

The living book of everything that went wrong while designing, building, and
stress-testing the blueprints. Every agent that works in this folder appends
here whenever it hits a bug, a weird quirk, or a full-on mistake: wrong
assumptions, misconfigurations, design errors, surprising API behavior,
anything that cost time or taught a lesson.

## Rules

- Append only. Never edit, delete, or reorder an existing entry.
- One entry per issue. If the same issue reappears, add a new entry and link it
  with a note like `related to entry #12`.
- Every blueprint run checks this file's rules before finishing: the
  BLUEPRINT-PROMPT.md hard rule 7 requires it.
- Read this file before starting any new blueprint. Past mistakes are the
  cheapest way to avoid new ones.

## Entry template (copy and fill)

```markdown
### #<next number>: <short title>

- Date: <YYYY-MM-DD>
- Service / sheet: <e.g. 07-support-triage / specs/07-support-triage.md>
- Context: <which workflow, node, or step was involved>
- Symptom: <what happened, observed behavior>
- Root cause: <why it happened>
- Fix / workaround: <what solved it>
- Lesson: <what to do differently next time>
- Related nodes / integrations: <n8n node types, APIs involved>
```

## Entries

### #1: Spec filename typo in the blueprint prompt input block

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: BLUEPRINT-PROMPT.md input block, SPEC_SHEET field
- Symptom: SPEC_SHEET pointed to `specs/04-booking-reimnders.md`, a file that does not exist; the actual sheet is `specs/04-booking-reminders.md`
- Root cause: typo in the input block ("reimnders" instead of "reminders")
- Fix / workaround: resolved by trusting the SHEET_TITLE field and the on-disk filename, which both agreed; built the blueprint from the correct sheet
- Lesson: before starting, verify every spec path in an input block against the filesystem; when path fields disagree, the sheet title and the existing file win
- Related nodes / integrations: none (process-level quirk, no n8n nodes involved)

### #2: Node typeVersions in skeleton and prior blueprints are outdated

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: prototype JSON build; typeVersion values in public/downloads/whatsapp-order-bot.json and in the previous 04 blueprint (recovered from git history)
- Symptom: skeleton and prior artifacts used webhook 2, googleSheets 4.5, scheduleTrigger 1.2, googleCalendar 3, slack 2; the current n8n master line uses webhook 2.1, googleSheets 4.7, scheduleTrigger 1.3, googleCalendar 1.3, slack 2.7, emailReadImap 2.2
- Root cause: typeVersion numbers are not printed on docs.n8n.io node reference pages; they live in the n8n source (packages/nodes-base/nodes, INodeTypeDescription defaultVersion). Older artifacts copied versions from older training data
- Fix / workaround: verified current versions from the n8n-io/n8n source via librarian research; prototype uses the current set; design section 12 warns to re-check on import
- Lesson: never copy typeVersion from an older demo JSON or blueprint; verify against the installed n8n version source before writing the prototype
- Related nodes / integrations: webhook, googleSheets, googleCalendar, scheduleTrigger, slack, emailReadImap

### #3: Tracked design file deleted in the working tree, recovered from git history

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: output path check before writing blueprints/designs/04-booking-reminders-blueprint.md
- Symptom: git status showed `D blueprints/designs/04-booking-reminders-blueprint.md`; the file existed in HEAD (commit 874c8d8) but not on disk
- Root cause: the previous run's design was deleted from the working tree without a commit; the BLUEPRINT-PROMPT stop condition "output path already exists" was therefore not triggered, but the ghost path could have caused a silent overwrite confusion
- Fix / workaround: checked git status and git show HEAD:path before writing; recovered the prior design to /var/tmp/opencode for context, then wrote the new v0.1 fresh
- Lesson: check git status for deleted-or-untracked output paths before every blueprint run, not just filesystem existence; the prompt's stop condition only sees the filesystem
- Related nodes / integrations: none (process-level quirk)

### #4: WhatsApp node has no interactive message operation; skeleton buttons invalid

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: prototype JSON build; skeleton public/downloads/whatsapp-order-bot.json and the prior 04 blueprint used messageType interactive with interactiveType/interactiveButtons
- Symptom: the skeleton quick-reply button shape does not exist in the current n8n WhatsApp node
- Root cause: the n8n WhatsApp node v1.1 messageType options are only audio/contacts/document/image/location/text/video; no interactive (verified in n8n master MessagesDescription.ts)
- Fix / workaround: dynamic slot buttons are sent by HTTP Request nodes (typeVersion 4.5) to the Meta Graph API /messages endpoint with an interactive button body; Cancel and Reschedule live in the approved WhatsApp template with fixed payloads that are resolved by phone number (n29, n29b, n29c); digit-reply fallback with a pending_offer column
- Lesson: verify node operation capabilities against current n8n source before trusting demo skeletons (the skeleton also used stale field names textBody and from)
- Related nodes / integrations: whatsApp, httpRequest, Meta WhatsApp Cloud API

### #5: Design-to-JSON structural mismatches fixed during the prototype build

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: writing builds/04-booking-reminders-prototype.json from design section 4
- Symptom: five places could not map to an importable workflow: three read nodes shared the name "Read bookings sheet" (n11/n49/n63; node names must be unique in n8n JSON); code node n27 had one output but the design routed button to n28 and digit to n27a (code nodes cannot fan out); the dedupe condition read "duplicateCount equals 0" with the duplicate branch on true (inverted); the reschedule offer (RESCHED fixed payload) had no booking id for its callbacks; the retry text claimed exponential backoff that n8n does not offer
- Root cause: design review focused on behavior, not the n8n JSON contract (unique names, single-output code nodes, switch rule order, fixed retry interval)
- Fix / workaround: renamed the read nodes; n02 now routes five cases and splits slot_choice into button and digit; dedupe condition changed to greater than 0; RESCHED resolves the booking by phone through n29, n29b and the new n29c router before n37 builds the offer; retry wording corrected to a fixed 1s interval
- Lesson: before locking a design, validate every multi-output routing claim and duplicated name against the node's real JSON contract; code nodes have exactly one main output
- Related nodes / integrations: code, switch, if, merge, googleSheets, googleCalendar

### #6: Multiple sed delete commands in one invocation delete one line; sequential invocations over-delete

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders (build tooling, no n8n nodes involved)
- Context: assembling the prototype JSON in chunks via bash heredocs, removing the temporary end-of-file markers
- Symptom: `sed -i -e "$d" -e "$d"` removed only the last line; two sequential `sed -i "$d"` calls then removed three lines total, deleting node n27d's closing brace and breaking JSON.parse at line 1003 ("Expecting property name enclosed in double quotes")
- Root cause: all -e commands in one invocation apply to the same last line, and the d command starts a new cycle; chaining two invocations deleted the last line twice plus the new last line
- Fix / workaround: repaired the file with a targeted edit re-inserting the closing brace, then re-validated with python3 json.load; for future chunked assembly, delete one line per invocation or strip the tail with head -n -2
- Lesson: verify the file tail byte-for-byte after any multi-command sed; treat sed address commands as per-invocation, not cumulative
- Related nodes / integrations: none (build process quirk)

### #7: Council review found import-blocking wiring: merge connections written input-side and error branches without onError

- Date: 2026-08-11
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md
- Context: council review of builds/04-booking-reminders-prototype.json after first validation
- Symptom: two defects that my validator missed: (1) the Merge node "Merge intake paths" declared its incoming edges under its own connections key pointing back at its upstream nodes (Duplicate intake?, Parse slot choice, Pick digit slot), while n8n 1.x connections are source-side, so the node "Check availability" had zero incoming connections and the whole availability-to-confirm chain would never execute; (2) the WhatsApp send nodes with fallback branches (Confirm, Send reminder 24h, Reminder 24h fallback, Send reminder 2h, Reminder 2h fallback, Recovery) wired main[1] error outputs without onError "continueErrorOutput", so n8n drops those outputs and the fallbacks would never fire
- Root cause: my JSON validator only checked that connection targets exist and that names are unique; it did not verify directionality, reachability, or the onError contract for error outputs. The merge's dual-input special case was written target-side following the design's mental model instead of the n8n source-side connection model
- Fix / workaround: rewrote the merge edges source-side ("Duplicate intake?" output index 1 to Merge input 0, "Parse slot choice" and "Pick digit slot" to Merge input 1, Merge output to "Check availability") and added onError "continueErrorOutput" to the six WhatsApp nodes with error branches; re-validated with a reachability walk from every trigger (all 93 nodes reachable)
- Lesson: validation must check reachability from triggers and the onError contract for every node that declares an error output, not just that target names exist; for nodes with multiple inputs, confirm which node owns the connection entry (source side) and which input index the target uses
- Related nodes / integrations: merge, whatsApp, if, switch, n8n workflow JSON connection model

### #8: Business-initiated text messages silently dropped by Meta; template messages deliver

- Date: 2026-08-14
- Service / sheet: 04-booking-reminders / sandbox testing (Meta test number +1 555-673-7357, phone number id 1182043231668173, Graph API v24.0)
- Context: live WhatsApp send tests from the sandbox: first a `type:text` send, then a second `type:text` send after the recipient was whitelisted via the API Setup UI test, then a `type:template` send (hello_world)
- Symptom: both API text sends returned HTTP 200 with a valid message id (wamid...) but the messages never arrived on the recipient phone; the template send to the same recipient delivered immediately; the API Setup UI test message (jaspers_market_order_confirmation_v1 sample template) also delivered
- Root cause: WhatsApp Business Platform policy - business-initiated messages must be template messages (or replies inside the 24h customer-service window after the customer messages first). Meta accepts the text send and issues a message id but silently drops delivery instead of returning an error, so a 200 response is no proof of delivery
- Fix / workaround: send every business-initiated message as a template; use plain text only for replies inside the 24h window. The 04 blueprint already does this (n23 Confirm, n52/n54 reminders, n70 Recovery use sendTemplate; fallback texts n24/n53/n55/n71 fire only on template error and are legal because they follow a customer message). For sandbox testing before template approval, the confirm path is still fully testable: customer texts in (opens the window), template fails, fallback text delivers
- Lesson: a success response plus message id from the Cloud API does not prove delivery; test with templates, and treat any business-initiated text outside the window as undeliverable by design. Reminder and recovery paths must never rely on plain-text fallback for delivery - if the template fails, expect the alert/retry path instead
- Related nodes / integrations: whatsApp, httpRequest, Meta WhatsApp Cloud API, message templates

### #9: WhatsApp Manager template quick-reply buttons have no payload field

- Date: 2026-08-14
- Service / sheet: 04-booking-reminders / specs/04-booking-reminders.md (sandbox)
- Context: creating the booking_confirm template in WhatsApp Manager; the quick-reply button editor shows only Type and Button Text fields, no payload field
- Symptom: the design assumed fixed payloads RESCHED and CANCEL delivered verbatim in button_reply.id; with no payload field, the exact id Meta assigns to a template button is not under our control
- Root cause: payload is a settable attribute only on interactive buttons sent via the Graph API; template quick-reply buttons carry no payload and Meta derives the webhook id from the button itself
- Fix / workaround: n01 (Normalize intake) now matches button replies by id or title, case-insensitive, so the template buttons use human-readable labels (Reschedule, Cancel) and the flow works regardless of the id Meta assigns; SLOT_ callbacks from our own Graph API interactive messages are unchanged. Design updated to v0.1.2 (section 6, section 5, changelog) and the guide updated (node-by-node, gotchas)
- Lesson: verify platform-side UI/API capability for every mechanism a design depends on, not only n8n node operations; when a field is not settable, match on the field that is guaranteed (title)
- Related nodes / integrations: whatsApp, Meta WhatsApp Cloud API, message templates

### #10: Live outbound parity break — whatsApp 1.1 credential 500 + quoted phoneNumberId (send_fix httpRequest patch)

- Date: 2026-08-27
- Service / sheet: 00-omni-chat-core / blueprints/builds/00-omni-chat-core-prototype.json:n06 (Send WhatsApp) — manifest send_fix
- Context: Send WhatsApp n06 outbound — repo blueprint/build used `whatsApp` 1.1 with `phoneNumberId: "{{CONFIG.whatsapp_phone_number_id}}"` and credential `whatsAppApi` (type whatsApp 1.1, quoted `phone_number_id` in URL/body); live manifest `send_fix` converted n06 to `httpRequest` Bearer `DEMO` token
- Symptom: fresh REBUILD-RUNBOOK import of 00 prototype would 500 — live `whatsAppApi` credential missing (live-only httpRequest patch not in repo); quoted `phone_number_id` (`"{{CONFIG.whatsapp_phone_number_id}}"`) would also break Graph API path if re-introduced
- Root cause: template used `whatsApp` 1.1 with credential `whatsAppApi` (credential id 1) for outbound; `phone_number_id` was quoted in the expression, and httpRequest Bearer parity was only applied live, not documented in repo blueprint §15.5 / REBUILD-RUNBOOK n05 `whatsapp_credential`
- Fix / workaround: live converted n06 to `httpRequest` 4.5 `POST https://graph.facebook.com/{{CONFIG.whatsapp_api_version}}/{{CONFIG.whatsapp_phone_number_id}}/messages` with `Authorization: Bearer {{CONFIG.whatsapp_token}}`; fixed quoted phone ID to unquoted `{{CONFIG.whatsapp_phone_number_id}}`; credential `whatsAppApi` not used for outbound (see `blueprints/sandbox/SETUP-GUIDE.md` §4a) — future 00 re-imports must use httpRequest 4.5, not whatsApp 1.1
- Lesson: use `httpRequest` for WhatsApp outbound (Graph API) — never `whatsApp` 1.1 with `whatsAppApi` credential for sends; `phone_number_id` must be unquoted (`{{CONFIG.whatsapp_phone_number_id}}`, not `"{{CONFIG.whatsapp_phone_number_id}}"`) in URL and body; keep verify layer byte-identical (GET challenge) but outbound intentionally httpRequest
- Related nodes / integrations: httpRequest, whatsApp, Meta WhatsApp Cloud API
