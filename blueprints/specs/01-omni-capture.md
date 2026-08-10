# Order and Lead Capture, Every Channel - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | omni-capture |
| Name | Order and lead capture, every channel |
| Version | v0.2 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Orders and leads arrive on WhatsApp, web forms, Messenger and email, and replies slip through the cracks. This blueprint collects every channel into one inbox, answers instantly with what customers ask for, and hands hot conversations to the team. For retailers, restaurants and service businesses that sell across apps.

## 3. Outcome metrics

- Replies within 5 seconds for instant channels (measured from trigger receipt to first outbound WhatsApp/webhook message).
- 15 minutes per order to 2 minutes (assumes a guided product, size, address and payment-instruction flow replaces back-and-forth typing).
- Zero orders lost to unanswered chats (assumes every inbound message gets at least one automated response, including after hours).
- 10+ hours saved weekly (assumes an owner previously retyped order details into a sheet by hand).

## 4. Scope

### 4.1 In scope

- Receive and reply on WhatsApp Business Cloud API (text messages and interactive button quick-replies).
- Receive web form submissions via a Webhook node (name, phone, message, source).
- Receive email enquiries via Gmail watch / IMAP trigger.
- Route each inbound message by stage: greeting, product selection, size, address, payment instruction, order confirmation.
- Capture leads (name, phone, message) and log them to a contacts sheet.
- Log completed orders to an orders sheet with a unique order id.
- Notify the team on Slack for hot conversations and for every order placed.
- Send a human handoff message and stop the bot when the customer asks for a person.

### 4.2 Out of scope

- No automated payment execution: small orders use the manual bKash human-confirm pattern, and large orders use the LC/bank channel with manual confirmation and proof upload. Personal bKash Transaction IDs cannot be verified by a public API.
- No custom web app UI and no mobile app.
- No inventory management and no stock syncing.
- No courier booking: the Pathao API node is a placeholder webhook that logs intent only.
- No free-form multi-language NLU beyond the canned greeting and quick replies.

## 5. Inputs and triggers

Trigger 1: WhatsApp Cloud API webhook (n8n node: Webhook, responseMode onReceived, path per client).

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "metadata": { "display_phone_number": "8801333095960", "phone_number_id": "PHONE_NUMBER_ID" },
            "contacts": [{ "profile": { "name": "Customer Name" }, "wa_id": "88017XXXXXXXX" }],
            "messages": [
              {
                "from": "88017XXXXXXXX",
                "id": "wamid.UNIQUE_MESSAGE_ID",
                "timestamp": "1723456789",
                "type": "text",
                "text": { "body": "Cotton Kurti" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Interactive button replies arrive as `type: "interactive"` with `interactive.button_reply.title` and `interactive.button_reply.id`. The flow must read both.

Trigger 2: Web form webhook (n8n node: Webhook, POST, path per client).

```json
{ "name": "Aisha Karim", "phone": "88017XXXXXXXX", "email": "aisha@example.com", "message": "Need 2 kurtis, size M", "source": "landing_page", "submittedAt": "2026-08-11T09:30:00+06:00" }
```

Trigger 3: Email enquiry (n8n node: Gmail trigger or emailReadImap). Fields read: `from`, `subject`, `bodyPlain`, `date`.

## 6. Workflow design

### 6.1 Main flow

1. Webhook (WhatsApp) -> respond HTTP 200 immediately with `{"status":"received"}` so the provider does not retry while the flow works. Process the rest asynchronously.
2. Code node "Parse Incoming Message": extract `from`, `messageId`, `text`, `interactive.button_reply.title`, `stage` from the payload. Output a normalized object.
3. IF node "Duplicate?" : skip if `messageId` was already processed (idempotency, see 6.4). On duplicate, exit.
4. Switch node "Stage Router": route on the customer's conversation stage (greeting, product, size, address, payment). Stage is read from the last stored row for this phone number.
5. Greeting stage: WhatsApp node sends the welcome message plus an interactive button menu with the product catalog (Cotton Kurti, Denim Jacket, Saree, per client). Store the customer row.
6. Product stage: Set node records the chosen product and price. WhatsApp node asks for size (S, M, L, XL buttons).
7. Size stage: Set node records the size. WhatsApp node asks for the delivery address as free text.
8. Address stage: Code node validates address length (min 8 chars). Set node stores the address. WhatsApp node sends the bKash payment instruction card with the merchant number, amount and a copy button.
9. Payment stage: Code node validates the Transaction ID format (10-12 alphanumeric characters). On invalid format, reply with a hint and stay in stage.
10. Payment-channel branch (set per client in the config block): bKash-manual path: Code node logs the TrxID to the orders sheet, then Slack posts a human-confirm message to #orders; a human verifies the payment in the bKash app within the SLA (default 30 minutes) and confirms, which continues the flow. LC/bank path: the flow waits on a manual confirmation step where a human uploads proof of the bank or LC confirmation before continuing. No automated TrxID verification via any public API.
11. Google Sheets node "Log Order": append the full order row (order id, customer, product, size, address, amount, trx id, status paid).
12. WhatsApp node "Order Confirmed": send order number, courier (Pathao) and expected delivery window.
13. HTTP Request node "Pathao placeholder": POST a stub delivery-intent record. On failure, log only and continue.
14. Wait node: 45 minutes, then WhatsApp "Shipped" update; Wait 45 minutes, then WhatsApp "Out for delivery" update.
15. Slack node: notify #orders with a compact summary for every confirmed order.
16. All non-WhatsApp triggers (form, email) funnel into the same lead-logging path: normalize -> append to contacts sheet -> Slack notify -> send confirmation reply on the originating channel.

### 6.2 Branch logic

- Stage Router switch: 5 outputs (greeting, product, size, address, payment), plus a default that resets a stale conversation to greeting.
- IF "Duplicate?": exits the flow silently on true.
- Payment-channel Switch: routes small orders (bKash-manual) to the human-confirm path and large orders (LC/bank) to the manual confirmation path, per the client config.
- IF "Is web form / email?": routes leads to the contact path instead of the order path.
- IF "Human handoff?": when the message text matches keywords (human, person, agent, help), send a handoff message with the team number and stop the bot for that conversation.

### 6.3 Error handling

- WhatsApp send failures: catch in the Error Trigger workflow, retry once, then alert on Slack #alerts with the failing message and payload.
- Unparseable webhook body: log raw payload to a dead-letter sheet column and alert, do not crash the flow.
- Empty or missing `from` / `text`: skip the message, do not reply.
- Google Sheets append failure (quota or auth): retry with backoff (1s, 5s, 30s), then alert and park the order in a pending sheet.
- Courier placeholder failure: non-fatal, log and continue.

### 6.4 Idempotency

- WhatsApp: dedupe on the unique `wamid` message id. Store processed ids in a hidden column of the orders/contacts sheet or an n8n static-data keyed set, and keep a rolling window of the last 1,000 ids.
- Web form: dedupe on (phone + submittedAt minute). Re-submits within the same minute are ignored.
- Orders: order id is generated once at first confirmation and reused for all follow-up messages.

### 6.5 Retry policy

- n8n Error Workflow: an Error Trigger node that posts to Slack #alerts with execution id, node name and error message.
- HTTP requests (WhatsApp send, Sheets, courier): retry 3 times with exponential backoff (1s, 5s, 30s).
- WhatsApp webhook: always 200 within 20 seconds; the provider's own retry covers timeouts.

## 7. Data model

Storage: Google Sheets, one spreadsheet per client.

Sheet "orders":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| order_id | string | SN-1042 | unique, generated by flow |
| customer_name | string | Aisha Karim | |
| phone | string | 88017XXXXXXXX | E.164 |
| channel | string | whatsapp | whatsapp, web, email |
| product | string | Cotton Kurti | |
| size | string | M | |
| address | string | House 12, Dhanmondi | |
| amount_bdt | number | 899 | |
| trx_id | string | 8N7KD2QPL4 | |
| status | string | paid | paid, pending, delivered |
| processed_msg_ids | string | wamid.xxx;wamid.yyy | idempotency window |
| created_at | timestamp | 2026-08-11T09:30+06:00 | client timezone |

Sheet "contacts":

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| lead_id | string | LD-0001 | |
| name | string | Aisha Karim | |
| phone | string | 88017XXXXXXXX | |
| email | string | aisha@example.com | |
| source | string | landing_page | whatsapp, web, email |
| message | string | Need 2 kurtis | |
| status | string | new | new, contacted, closed |
| created_at | timestamp | 2026-08-11T09:30+06:00 | |

Naming: sheets prefixed with the client slug (clientname_orders). Timestamps stored in the client timezone with explicit offset.

## 8. Per-client configuration block

- [ ] WhatsApp business phone number and phone number ID: ...
- [ ] WhatsApp Cloud API access token: ...
- [ ] Verify token for the webhook: ...
- [ ] Product catalog: array of { id, name, price_bdt } (3-5 items, used for quick-reply buttons): ...
- [ ] bKash merchant number: ...
- [ ] Payment channel: bKash-manual | LC/bank (pick one, used by the payment-channel branch): ...
- [ ] Greeting text (Bangla + English flavor): ...
- [ ] Business hours (for handoff behavior): ...
- [ ] Team handoff phone number(s): ...
- [ ] Google Sheets spreadsheet id + sheet names: ...
- [ ] Slack webhook URL + channel names (#orders, #alerts): ...
- [ ] Pathao / courier credentials (placeholder): ...
- [ ] Brand voice prompt for the confirmation messages: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek / LLM | $0 | no LLM in the core flow, canned quick replies |
| WhatsApp | $3-15 | 500 conversations/month, service category ~$0.005-0.03 per conversation |
| Google Sheets | $0 | free tier |
| **Total** | **$6-21** | for an SMB doing 300-500 conversations/month |

Verify against current WhatsApp Cloud API conversation rates before quoting.

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| WhatsApp webhook timeout | provider retry signature repeats | always return 200 immediately, process asynchronously |
| Invalid message payload | parse error in Code node | log raw payload, skip, alert on Slack |
| Duplicate event | message id already stored | dedupe IF node exits silently |
| TrxID invalid format | regex check fails | reply with format hint, stay in payment stage |
| bKash human-confirm not done in SLA | pending flag older than 30 min | re-alert on Slack, keep order pending |
| Google Sheets quota exhausted | API 429 error | retry with backoff, then park in pending sheet and alert |
| WhatsApp token expiry | 401 on send | alert on Slack, pause sends, document refresh step |
| Courier API outage | HTTP 5xx | log intent only, continue flow |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path order | Send product -> size -> address -> valid TrxID | Order confirmed, sheet row appended, Slack notified |
| 10x volume | Fire 100 webhook POSTs in 5 minutes | All processed, no duplicate replies, p95 latency < 20s |
| Malformed payload | POST `{}` and a text-only payload | Flow logs and skips, no crash, no outbound reply |
| Empty / short address | Send address "x" | Flow replies asking for a valid address, no order created |
| Duplicate event | Re-send the same wamid twice | Second copy produces zero outbound messages |
| Simulated WhatsApp outage | Point token to an invalid one | Error workflow alerts Slack, flow does not crash |
| Quota exhaustion | Fill Sheets write quota (mock 429) | Retries, then pending sheet + Slack alert |
| Concurrent runs | 10 parallel order flows same product | Every order gets a unique order id, sheet count matches |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |
| v0.2 | 2026-08-11 | founder decisions: cheap VPS cost basis, manual bKash for small orders + LC/bank for large, DeepSeek primary model, CRM clarified |

## 13. References

- Closest demo n8n workflow: public/downloads/whatsapp-order-bot.json (26 nodes). Reuse the stage router, quick-reply product menu, bKash instruction card, TrxID validation, Sheets logging and courier placeholder chain. Extend with the web form and email triggers and the lead path.
- WhatsApp Cloud API: developers.facebook.com/docs/whatsapp/cloud-api (webhook payloads, message types, conversation pricing).
- bKash merchant API: developers.bkash.com (sandbox only; small orders use the manual human-confirm pattern, large orders use LC/bank with manual confirmation; no automated TrxID verification via public API).
- DeepSeek API: platform.deepseek.com (deepseek-chat and deepseek-reasoner; DeepSeek pricing, model provider swappable per client via the config block).
- n8n nodes: Webhook, Code, IF, Switch, Wait, Error Trigger, Google Sheets, Slack, HTTP Request.
- Pathao courier API: api-hermes.pathao.com docs (placeholder only at v0.1).
