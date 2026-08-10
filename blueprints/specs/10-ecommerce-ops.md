# E-commerce Ops Sync - Blueprint Spec Sheet

## 1. Header

| Field | Value |
| --- | --- |
| Service id | ecommerce-ops |
| Name | E-commerce ops sync |
| Version | v0.1 |
| Status | draft |
| Date | 2026-08-11 |
| Owner | Nexus Automations |

## 2. Summary

Orders land in Shopify or WooCommerce, and every step after that is manual: status messages, payment chasing, courier booking and inventory. This blueprint syncs store orders into WhatsApp order-status updates, sends bKash or Nagad payment links, books Pathao or Steadfast couriers and keeps inventory in sync. For e-commerce sellers in Bangladesh on Shopify or WooCommerce.

## 3. Outcome metrics

- Order status updates reach customers automatically (assumes the store webhook fires on every status change).
- Payment links sent on demand and tracked to paid (assumes bKash or Nagad payment-link generation for the merchant).
- Courier booked in under 1 minute per order (assumes Pathao or Steadfast API credentials are configured).
- Inventory stays in sync across the store and marketplaces (assumes one source of truth and a scheduled reconciliation).
- Deeper courier and payment handling than off-the-shelf e-commerce service providers (this is the differentiation, not store-internal automation).

## 4. Scope

### 4.1 In scope

- Ingest store orders from Shopify and WooCommerce webhooks.
- Send WhatsApp order-status templates: payment required, confirmed, shipped, out for delivery, delivered, returned.
- Generate and send bKash or Nagad payment links and track them to paid.
- Book Pathao or Steadfast courier deliveries and store the tracking id.
- Reconcile inventory on a schedule: store stock to marketplaces or a master sheet, alert on large deltas.
- Log every order through its full status lifecycle in one orders sheet.

### 4.2 Out of scope

- No rebuilding store-internal automation: Shopify Flow and native WooCommerce plugins stay in charge of store logic.
- No custom checkout or full payment gateway integration: only payment links.
- No multi-currency or international shipping.
- No custom web app or dashboard UI: the ops view is a Google Sheets view.
- No bulk WhatsApp marketing: order-status messages only.

## 5. Inputs and triggers

Trigger 1: Shopify webhook (n8n node: Webhook, POST, shopify path). Payload fields:

```json
{ "id": 1234567890, "order_number": 1042, "email": "customer@example.com", "phone": "+88017XXXXXXXX", "total_price": "1500.00", "currency": "BDT", "financial_status": "pending", "fulfillment_status": null, "line_items": [ { "sku": "KRT-001", "title": "Cotton Kurti", "quantity": 2 } ], "created_at": "2026-08-11T10:00:00Z" }
```

Trigger 2: WooCommerce webhook (n8n node: Webhook, POST, woocommerce path). Payload fields: `id`, `number`, `status`, `billing{first_name,phone,email}`, `line_items[{sku,name,quantity}]`, `total`, `currency`, `date_created`.

Trigger 3: Schedule Trigger (n8n node: Schedule Trigger) for inventory reconciliation: cron `0 6 * * *` (Asia/Dhaka).

Trigger 4: Courier callback webhook (Pathao or Steadfast) for delivery status: fields `merchant_order_id`, `consignment_id`, `delivery_status`.

## 6. Workflow design

### 6.1 Main flow

1. Webhook -> IF node "Valid order?": order id present and store secret verified.
2. Code node "Normalize order": canonical object with store, order_id, customer, items, total, currency, financial_status, fulfillment_status.
3. IF node "Paid or unpaid?": financial_status pending -> payment path; paid -> fulfillment path.
4. Payment path: Code node "Build payment link": call the bKash or Nagad payment-link endpoint, or build a manual payment instruction when links are unavailable. WhatsApp node "Payment required template": send the link or instruction. Wait node "Payment confirmation": webhook callback or manual confirm (per config). IF "Paid?" -> fulfillment path; else re-send once after 24h then flag for human.
5. Fulfillment path: Code node "Map courier fields": recipient, phone, address, COD amount, pickup defaults from config. HTTP node "Book courier": POST to Pathao or Steadfast create-order endpoint. Code node "Store tracking id": update the orders row.
6. WhatsApp node "Shipped template": order number, courier, tracking id.
7. Courier callback webhook -> Code node "Update delivery status" -> WhatsApp node "Delivered or returned template": delivered closes the order; returned routes to a refund note.
8. Inventory path (schedule): HTTP node "Pull stock" (store API) -> Code node "Reconcile": diff against the master sheet or marketplace levels -> HTTP node "Push stock" to marketplaces -> IF "Delta above threshold?" -> Slack node "#inventory alert".
9. Code node "Log order": update the lifecycle status on every step.
10. noOp "Done" on every terminal branch.

### 6.2 Branch logic

- IF "Valid order?": process vs reject and log.
- IF "Paid or unpaid?": payment link path vs fulfillment path.
- IF "Paid?": proceed vs re-send + human flag.
- Courier callback: delivered vs returned.
- Inventory delta: alert vs silent sync.

### 6.3 Error handling

- Store webhook timeout: return 200 immediately, process asynchronously.
- Courier booking failure: retry twice, then a manual queue row and a Slack alert.
- Payment link failure: send the manual payment instruction instead; the human-confirm path covers TrxID entry.
- Tracking callback missed: a daily reconcile sweep compares courier status to the orders sheet.
- Inventory push failure: alert on Slack, keep the master sheet as truth.
- Template rejection by WhatsApp: alert, correct the template, retry.

### 6.4 Idempotency

- store order_id is the unique key in the orders sheet; webhook re-delivery updates the same row.
- Payment link sent once per order (link_log guard).
- Courier booking guarded by a booking flag; re-runs cannot double-book.
- Inventory reconcile is a full-sync and safe to re-run.
- Courier callbacks key on merchant_order_id.

### 6.5 Retry policy

- n8n Error Workflow: Error Trigger -> Slack #alerts.
- HTTP calls (courier, payment links, store APIs): retry 3 times, exponential backoff (1s, 5s, 30s).
- Courier booking: retry twice, then manual queue.
- Status sends: retry once, then flag for human.

## 7. Data model

Storage: Google Sheets, one workbook per client. Sheet names prefixed with the client slug.

orders sheet (clientname_orders):

| Field | Type | Example | Notes |
| --- | --- | --- | --- |
| order_id | string | 1042 | dedupe key |
| store | string | shopify | shopify, woocommerce |
| customer_name | string | Rahim Ahmed | |
| phone | string | +88017XXXXXXXX | E.164 |
| items | string | KRT-001 x2 | sku + qty list |
| total | number | 1500 | |
| currency | string | BDT | |
| payment_status | string | pending | pending, paid, refunded |
| payment_link | string | https://... | |
| link_sent_at | timestamp | 2026-08-11T10:05+06:00 | |
| courier | string | pathao | pathao, steadfast |
| tracking_id | string | PATH-88231 | |
| status | string | shipped | new, payment_pending, shipped, out_for_delivery, delivered, returned, refunded |
| updated_at | timestamp | 2026-08-11T12:00+06:00 | |
| created_at | timestamp | 2026-08-11T10:00+06:00 | |

link_log sheet: order_id, link, sent_at. inventory_sync_log sheet: sku, store, store_stock, marketplace_stock, delta, synced_at. Timestamps in the client timezone (default Asia/Dhaka).

## 8. Per-client configuration block

- [ ] Store type (Shopify or WooCommerce) + API credentials + webhook secret: ...
- [ ] WhatsApp number + token + order-status templates (payment required, shipped, out for delivery, delivered, returned): ...
- [ ] Payment channel: bKash-manual | LC/bank (payment-link flow for bKash or Nagad on the payment path): ...
- [ ] bKash or Nagad merchant credentials (payment-link generation): ...
- [ ] Courier (Pathao or Steadfast) API credentials + pickup address defaults: ...
- [ ] DeepSeek API key + model (default deepseek-chat; used only for stock notes and item descriptions): ...
- [ ] Model provider (DeepSeek default; OpenAI or Anthropic fallback): ...
- [ ] Inventory source of truth (store or master sheet) + marketplace list: ...
- [ ] Stock delta threshold for alerts: ...
- [ ] COD vs prepaid defaults per product category: ...
- [ ] Sheets ids and names: ...

## 9. Cost model

| Item | Monthly cost | Assumption |
| --- | --- | --- |
| n8n VPS | $3-6 | cheap VPS (Hetzner CX22 tier) or free tiers (Oracle Cloud Always Free); $1/mo promos exist but are unreliable |
| DeepSeek | $0-1 | minimal LLM use; only stock notes and item descriptions |
| WhatsApp | $3-15 | 500 order-status conversations/month, service category |
| Courier (Pathao/Steadfast) | $0 | per-order fees billed by the courier, not monthly |
| Store plan (Shopify/Woo) | $0 | already paid by the client |
| **Total** | **$6-22** | platform fees excluded; per-store stack $2,000-5,000 + retainer $300-1,000/mo |

## 10. Failure modes and mitigations

| Failure mode | Detection | Mitigation |
| --- | --- | --- |
| Store webhook outage | no events in the last hour | reconciliation sweep re-pulls recent orders, alert |
| Courier API down | 5xx or timeout | retry twice, manual queue row, Slack alert |
| Payment link failure | 4xx or 5xx on generation | manual payment instruction, human-confirm path |
| Duplicate webhook delivery | order_id seen | update existing row, no duplicate sends |
| Tracking callback missed | reconcile sweep mismatch | status updated from courier API on next sweep |
| Inventory push quota | 429 | backoff, master sheet stays truth, alert |
| WhatsApp template rejection | 4xx on send | alert, template corrected, retry |
| Credential expiry | 401 on store or courier API | alert, queue held until re-auth |

## 11. Stress-test criteria

| Scenario | How to run it | Pass threshold |
| --- | --- | --- |
| Happy path paid -> shipped | POST a paid Shopify order | Payment skipped, courier booked, tracking sent, status shipped |
| Payment path | POST an unpaid order | Payment link sent, order marked payment_pending |
| Payment confirmed | Callback or manual confirm | Order moves to fulfillment, no duplicate link |
| Courier booking failure | Mock courier 5xx | Retried twice, manual queue row, Slack alert |
| 10x volume | POST 200 orders in a minute | All rows logged, each updated once, no double sends |
| Duplicate webhook | Re-send the same order twice | One row, one status message |
| Webhook timeout | Slow processing | 200 returned immediately, async continues |
| Stock delta | Change stock beyond threshold | Inventory alert posted, marketplaces updated |
| Data consistency | Re-run reconciliation | No duplicate rows, totals match store API |

## 12. Version history

| Version | Date | Change |
| --- | --- | --- |
| v0.1 | 2026-08-11 | Initial draft |

## 13. References

- Closest demo n8n workflows: public/downloads/whatsapp-order-bot.json (26 nodes) for WhatsApp order-status templates and the orders sheet pattern, and public/downloads/spreadsheet-rescue.json (17 nodes) for the inventory normalize and dedupe steps.
- Differentiation note: this service goes deeper on courier booking and payment links than generic e-commerce service providers; store-internal automation stays with Shopify Flow or native plugins.
- External docs: Shopify webhooks (shopify.dev/docs/apps/build/webhooks), WooCommerce webhooks (woocommerce.com/document), Pathao (api-hermes.pathao.com) and Steadfast APIs, bKash and Nagad payment-link docs, DeepSeek API (platform.deepseek.com), n8n nodes (docs.n8n.io).
