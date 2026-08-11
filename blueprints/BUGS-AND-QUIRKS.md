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
