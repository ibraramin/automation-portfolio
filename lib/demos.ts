export interface DemoMeta {
  /** "whatsapp-order-bot" | "ai-invoice-reader" | "lightning-lead-response" | "meeting-minutes-bot" | "spreadsheet-rescue" | "email-triage" */
  slug:
    | "whatsapp-order-bot"
    | "ai-invoice-reader"
    | "lightning-lead-response"
    | "meeting-minutes-bot"
    | "spreadsheet-rescue"
    | "email-triage";
  title: string;
  /** outcome-first one-liner */
  tagline: string;
  markets: string[];
  metric: string;
  tech: string[];
  /** path under /public, e.g. "/downloads/whatsapp-order-bot.json" */
  jsonFile: string;
  /** 2-3 sentences for the detail page */
  description: string;
}

export const DEMOS: DemoMeta[] = [
  {
    slug: "whatsapp-order-bot",
    title: "WhatsApp Order Bot",
    tagline:
      "Turn WhatsApp chats into paid orders with product, size, bKash payment and courier dispatch without a human in the loop.",
    markets: ["E-commerce", "Retail"],
    metric: "15 min per order → 2 min",
    tech: ["n8n", "WhatsApp Cloud API", "OpenAI", "bKash", "Google Sheets", "Pathao"],
    jsonFile: "/downloads/whatsapp-order-bot.json",
    description:
      "Customers order through WhatsApp the way they already chat. They pick a product, choose a size, drop an address and pay via bKash. The bot verifies the payment, logs the order and hands it to Pathao for delivery. It is the same flow a human used to run, minus the 15 minutes per order.",
  },
  {
    slug: "ai-invoice-reader",
    title: "AI Invoice Reader",
    tagline:
      "Drop in a supplier invoice and get vendor, VAT and line items extracted, ready to post to your books.",
    markets: ["Accounting", "Professional services"],
    metric: "4 hrs → 15 min per week",
    tech: ["n8n", "OpenAI Vision", "tesseract.js", "Gmail", "Google Sheets"],
    jsonFile: "/downloads/ai-invoice-reader.json",
    description:
      "Invoices arrive as messy PDFs and photos, and someone retypes them by hand. This bot reads the document with AI, validates every field and appends the row to a ledger sheet. One workflow replaces four hours of typing.",
  },
  {
    slug: "lightning-lead-response",
    title: "Lightning Lead Response",
    tagline:
      "Reply to inbound leads in under five minutes: scored, personalized and logged before your competitor opens their inbox.",
    markets: ["Agencies", "B2B sales"],
    metric: "6 hrs → <5 min response",
    tech: ["n8n", "OpenAI", "HubSpot", "Airtable", "Slack"],
    jsonFile: "/downloads/lightning-lead-response.json",
    description:
      "Every lead message is scored for intent, matched against a personalized reply draft, saved to your CRM and pushed to the team on Slack automatically. The window where a lead is warm and nobody has replied yet disappears.",
  },
  {
    slug: "meeting-minutes-bot",
    title: "Meeting Minutes Bot",
    tagline:
      "Paste a raw transcript and get decisions, owners and deadlines, delivered straight to Notion and Slack.",
    markets: ["Teams", "Remote work"],
    metric: "2 hrs of notes → 5 min",
    tech: ["n8n", "Whisper", "OpenAI", "Notion", "Slack"],
    jsonFile: "/downloads/meeting-minutes-bot.json",
    description:
      "Recordings pile up as raw transcripts nobody reads. Paste one in and the bot simulates Whisper transcription, extracts the decisions and owner-assigned action items, then posts clean minutes to Notion and Slack. A two-hour meeting becomes a five-minute read.",
  },
  {
    slug: "spreadsheet-rescue",
    title: "Spreadsheet Rescue",
    tagline:
      "Paste a messy export and get clean, deduplicated rows ready for your CRM or sheets.",
    markets: ["Ops teams", "Admin"],
    metric: "A week of cleanup → one upload",
    tech: ["n8n", "OpenAI structured outputs", "Supabase", "Airtable"],
    jsonFile: "/downloads/spreadsheet-rescue.json",
    description:
      "Every team keeps a spreadsheet only its owner understands. Paste a messy export and this bot simulates AI cleaning: a schema is suggested, duplicates are merged, names and dates are standardized, and every row is validated. The clean table uploads straight to your CRM or Airtable.",
  },
  {
    slug: "email-triage",
    title: "Email Triage",
    tagline:
      "Your inbox classified, prioritized and pre-drafted, with a human approving every send.",
    markets: ["Founders", "B2B"],
    metric: "Inbox zero, minus the stress",
    tech: ["n8n", "Gmail API", "OpenAI", "HubSpot"],
    jsonFile: "/downloads/email-triage.json",
    description:
      "Three emails land in a mock Gmail inbox. The bot classifies each as lead, invoice or spam, ranks them by priority and drafts a reply for the ones that matter. You approve before anything sends, and every exchange is logged to your CRM timeline.",
  },
];
