> **Note (2026-08-27 pivot):** This spec is now subsumed by `00-omni-chat-core` unified build. Retained for traceability; see `blueprints/README.md` and `docs/specs/Omni-Unified-Spec.md`.

# AI Document Processing - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | doc-processing |
| Name | AI document processing |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Invoices, receipts and contracts arrive as PDFs and photos, and the team retypes them into spreadsheets and folders by hand. This blueprint reads any document with AI, extracts the fields the client needs, validates them and files everything into the client's accounting tools. For accounting firms, agencies and professional services.

## 3. Outcome metrics

- 4 hours of data entry to 15 minutes per week (assumes 60-80 documents per week processed automatically).
- Zero fields retyped for validated documents (assumes the validation gate catches uncertain fields before they reach the books).
- 100% of processed documents logged with a status (validated, review, duplicate) for auditability.
- 10+ hours saved weekly (assumes one staff member previously did all retyping).

## 4. Scope

### 4.1 In scope

- Ingest documents from an email inbox (Gmail watch / IMAP, PDF and image attachments) and from an upload webhook.
- Extract text from PDFs (Extract from File node) and images (OCR via tesseract.js fallback or a vision-capable DeepSeek variant).
- Extract structured fields with DeepSeek (deepseek-chat for clean text, deepseek-reasoner for complex documents): vendor, invoice number, date, currency, net, vat rate, vat, total, line items. Image extraction runs through a vision-capable DeepSeek variant or the tesseract.js fallback.
- Validate required fields and route incomplete extractions to a human review branch.
- Detect duplicate invoices by invoice number before appending.
- Append validated rows to a Google Sheets ledger.
- Confirm to the sender by email and notify the finance channel on Slack.

### 4.2 Out of scope

- No payment execution and no bank reconciliation.
- No custom web app UI and no mobile app.
- No modification of the source emails or attachments.
- No OCR training or fine-tuning: extraction uses stock models.
- No posting to accounting systems in v0.1: QuickBooks/Xero sync is a documented extension point only.

## 5. Inputs and triggers

Trigger 1: Email with attachment (n8n node: Gmail trigger, poll or watch).

```json
{
  "from": "billing@acmesupplies.de",
  "subject": "Invoice INV-2026-0441",
  "date": "2026-03-12T08:00:00Z",
  "attachments": [
    { "fileName": "invoice-2026-0441.pdf", "mimeType": "application/pdf", "binaryId": "uuid" }
  ]
}
```

Trigger 2: Upload webhook (n8n node: Webhook, POST, multipart form).

```json
{ "file": "<binary>", "meta": { "uploadedBy": "accounting", "clientRef": "ACME-0142" } }
```

Supported files: PDF, PNG, JPG, WEBP. Maximum attachment size: 10 MB.

## 6. Workflow design

### 6.1 Main flow

1. Trigger (Gmail watch or upload Webhook). For email, respond to the provider immediately; process asynchronously.
2. IF node "Has attachment?": true continues, false replies "no attachment" to the sender and exits.
3. Code node "Extract attachment": pull the binary and its filename.
4. IF node "Attachment is PDF?": PDF -> Extract from File node (operation fromPdf, binaryProperty data); image -> DeepSeek vision reads the image binary directly (OCR path), else the tesseract.js fallback. Unsupported types go to a Slack warning and exit.
5. Code node "Normalize text": strip repeated whitespace, keep the raw text for the model.
6. DeepSeek node "Extract Invoice" (deepseek-chat for clean text, deepseek-reasoner for complex documents, temperature 0). System prompt demands strict JSON: {"vendor","invoiceNumber","date","currency","net","vatRate","vat","total","lines":[{"description","qty","unit","amount"}]}. Missing fields must be null, never invented.
7. Code node "Parse + validate JSON": extract the JSON object between the first `{` and last `}`, compute the `missing` field list (vendor, invoiceNumber, date, total required).
8. Code node "Compute totals": derive net, vat and total from line items when the model left them null.
9. IF node "All fields present?": true -> duplicate check; false -> Slack "Review needed" + Set flag and exit to the review branch.
10. Google Sheets node "Lookup existing": list the ledger and search by invoiceNumber.
11. IF node "Duplicate?": true -> email the sender "already logged", exit. False -> continue.
12. Google Sheets node "Append to ledger": append the row (date, vendor, invoice_number, net, vat, total, currency, status validated, source file, processed_at).
13. Gmail node "Confirm to sender": short confirmation with the invoice number and total.
14. Slack node "Log notification": post to #finance with vendor, invoice number, total and line count.
15. noOp "Done".

Review branch: Slack "Review needed" with the missing fields and filename, Set node flags the row `needs_review`, then the human fixes it in the ledger directly.

### 6.2 Branch logic

- IF "Has attachment?": true/false.
- IF "Attachment is PDF?": PDF vs image vs unsupported.
- IF "All fields present?": validated vs review.
- IF "Duplicate?": already-logged vs append.

### 6.3 Error handling

- OCR / PDF extraction yields fewer than 20 characters of text: fall back to the "paste the text instead" message to the sender, do not guess.
- Model returns non-JSON: retry once with the same payload, then route to the review branch.
- Malformed attachment (zero-byte or corrupt): reply to the sender asking for a re-upload, alert on Slack.
- Sheet append failure: retry with backoff, then alert and keep the row in a pending sheet.
- Currency ambiguity (multiple currency symbols): set status review, do not append.

### 6.4 Idempotency

- Email trigger: dedupe on Gmail message id; processed ids stored in a hidden sheet column.
- Invoice level: duplicate check on invoiceNumber in the ledger before every append. This is the primary guard, so re-processing the same invoice can never double-log it.
- Upload webhook: dedupe on clientRef when provided.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts with execution id, node and error.
- Model calls: retry 3 times, exponential backoff (1s, 5s, 30s), honoring 429 rate-limit headers.
- Google Sheets writes: retry 3 times, then pending-sheet fallback.

## 7. Data model

Storage: Google Sheets ledger, one spreadsheet per client.

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| date | date | 2026-03-12 | invoice date, ISO |
| vendor | string | Acme Supplies GmbH | |
| invoice_number | string | 2026-0142 | duplicate key |
| net | number | 1248.00 | EUR |
| vat | number | 237.12 | EUR |
| vat_rate | number | 19 | percent |
| total | number | 1485.12 | EUR |
| currency | string | EUR | |
| status | string | validated | validated, review, duplicate |
| source_file | string | invoice-2026-0441.pdf | |
| processed_at | timestamp | 2026-08-11T09:30+06:00 | |
| processed_msg_id | string | 182f9d... | idempotency |

Naming: ledger sheet named clientname_invoices_YYYY per year. Line items stored in a second sheet clientname_invoice_lines keyed by invoice_number. Timestamps in the client timezone with offset.

## 8. Per-client configuration block

- [ ] Inbox email address + Gmail/IMAP credentials: ...
- [ ] DeepSeek API key + model (default deepseek-chat; deepseek-reasoner for complex documents): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback swappable here): ...
- [ ] Required fields for validation (default: vendor, invoiceNumber, date, total): ...
- [ ] Default currency and VAT rate (used when the document is ambiguous): ...
- [ ] Document languages (affects the OCR prompt): ...
- [ ] Google Sheets spreadsheet id + ledger sheet name(s): ...
- [ ] Slack webhook + finance channel name: ...
- [ ] Accounting system (QuickBooks/Xero) credentials, if sync enabled: ...
- [ ] Confirmation email copy: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $0.50-2 | 200 documents/month, ~$0.003-0.01 per document (deepseek-chat; DeepSeek pricing is much lower than OpenAI) |
| Google Sheets / Gmail | $0 | free tier |
| **Total** | **$4-8** | at 200 documents/month |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Unreadable scan / photo | extracted text < 20 chars | paste-text fallback message to sender |
| Wrong document language | extraction confidence low or missing fields | review branch + language prompt in config |
| Missing required fields | validation gate fails | review branch with the missing list |
| Duplicate invoice | invoice_number already in ledger | "already logged" reply, no second row |
| Model outage or rate limit | 5xx / 429 | retry with backoff, then review branch + Slack alert |
| Gmail API quota | 429 from Gmail | backoff, skip non-critical sends |
| Attachment too large | file > 10 MB | reject with clear reply to sender |
| Currency ambiguity | multiple symbols detected | status review, never append |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path PDF invoice | Email the Acme sample (invoice 2026-0142.pdf) | Row appended, sender confirmed, Slack posted |
| Image scan | Upload a photographed invoice (JPG) | Extraction completes with >= 3 of 4 required fields |
| Malformed PDF | Upload a corrupt PDF (rename a text file) | Graceful reject + sender message, no crash |
| 10x volume | Drop 100 attachments into the inbox in 10 minutes | All processed, no duplicates, p95 latency < 60s |
| Empty extraction | Upload a blank white image | Review branch + alert, no row appended |
| Duplicate event | Re-send the same invoice twice | Second copy replies "already logged", one row total |
| Simulated model outage | Use an invalid API key | Retries, then review branch + Slack alert |
| Data consistency | Compare ledger rows to source emails | Row count equals unique invoice count, zero dupes |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflow: public/downloads/ai-invoice-reader.json (21 nodes). Reuse the email + webhook triggers, PDF extraction, DeepSeek strict-JSON prompt, validation gate, duplicate lookup and ledger append. Also see public/downloads/spreadsheet-rescue.json (17 nodes) for the normalization patterns.
- DeepSeek API: platform.deepseek.com (deepseek-chat and deepseek-reasoner; pricing is DeepSeek-based, model provider swappable per client; image extraction via DeepSeek vision or tesseract.js fallback).
- n8n nodes: Gmail Trigger, EmailReadImap, Extract from File, DeepSeek (or model provider), Google Sheets, Gmail, Slack, Code, IF.
- tesseract.js (browser-side OCR fallback): github.com/naptha/tesseract.js.
