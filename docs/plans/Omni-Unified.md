---
plan name: Omni-Unified
plan description: Unified omni-core pivot build
plan status: active
---

## Idea
Make 00-omni-chat-core the single main build that subsumes 01-10 (experience compression). Ten services (01 capture, 02 doc processing, 03 lead response, 04 booking reminders as superseded slice, 05 voice, 06 reporting, 07 support triage, 08 outbound, 09 reviews, 10 ecommerce) become capabilities inside one 71-node n8n blueprint; 11-automation-debugging stays a separate runbook. Unify docs (pivot banners, deprecation notes), keep pre-omni history for traceability, and land repo/live parity (tunnel constitutes-cats-wheels-app, verify layer bracket notation, httpRequest outbound, RAG guided fallback) so a fresh rebuild imports clean.

## Implementation
- Create Omni-Unified-Spec (feature) as single source of truth for 00 encompassing 01-10 (04 superseded slice, 11 separate), with 71 nodes, tunnel, verify layer, httpRequest outbound, RAG/bracket notation
- Prepend pivot banners to Portfolio-Feature-Spec, Portfolio-Repo-Spec, and Automation-Portfolio plan (keep original body) and prepend subsumed banners to 01..10 specs plus retained note to 11
- Update blueprints/README.md and BUGS-AND-QUIRKS parity notes to point to 00 as main (§4a/§4b, #10) and ensure config-template meta_verify_token is {{CONFIG.meta_verify_token}}
- Re-anchor 00 artifacts when ephemeral branch is available (00 blueprint/prototype 71 nodes, REBUILD/GOLIVE guides) and validate httpRequest 4.5 outbound + unquoted phone_number_id + verify byte-identical
- Run stress + E2E against 00 (tunnel handshake, hi→guided and bridal→RAG[services], 10x volume, dupe, outage, quota) and document results
- Dispatch @reviewer (9 categories) + @requirements-reviewer (verbatim pivot) and commit unified pivot

## Required Specs
<!-- SPECS_START -->
- Omni-Unified-Spec
- Portfolio-Repo-Spec
<!-- SPECS_END -->