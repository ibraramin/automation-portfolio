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

_No entries yet. This log starts empty on purpose: the first mistakes are
waiting to be made and learned from._
