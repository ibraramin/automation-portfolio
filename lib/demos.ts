export interface DemoMeta {
  /** "whatsapp-order-bot" | "ai-invoice-reader" | "lightning-lead-response" */
  slug: "whatsapp-order-bot" | "ai-invoice-reader" | "lightning-lead-response";
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
      "Turn WhatsApp chats into paid orders — product, size, bKash payment and courier dispatch without a human in the loop.",
    markets: ["Bangladesh"],
    metric: "15 min per order → 2 min",
    tech: ["n8n", "WhatsApp Cloud API", "OpenAI", "bKash", "Google Sheets", "Pathao"],
    jsonFile: "/downloads/whatsapp-order-bot.json",
    description:
      "Customers order through WhatsApp the way they already chat — pick a product, choose a size, drop an address and pay via bKash. The bot verifies the payment, logs the order and hands it to Pathao for delivery. The same flow a human used to run, minus the 15 minutes per order.",
  },
  {
    slug: "ai-invoice-reader",
    title: "AI Invoice Reader",
    tagline:
      "Drop in a supplier invoice and get vendor, VAT and line items extracted — ready to post to your books.",
    markets: ["Europe"],
    metric: "4 hrs → 15 min per week",
    tech: ["n8n", "OpenAI Vision", "tesseract.js", "Gmail", "Google Sheets"],
    jsonFile: "/downloads/ai-invoice-reader.json",
    description:
      "Invoices arrive as messy PDFs and photos, and someone retypes them by hand. This bot reads the document with AI, validates every field and appends the row to a ledger sheet — one workflow instead of four hours of typing.",
  },
  {
    slug: "lightning-lead-response",
    title: "Lightning Lead Response",
    tagline:
      "Reply to inbound leads in under five minutes — scored, personalized and logged before your competitor opens their inbox.",
    markets: ["Bangladesh", "Europe"],
    metric: "6 hrs → <5 min response",
    tech: ["n8n", "OpenAI", "HubSpot", "Airtable", "Slack"],
    jsonFile: "/downloads/lightning-lead-response.json",
    description:
      "Every lead message is scored for intent, matched against a personalized reply draft, saved to your CRM and pushed to the team on Slack — automatically. The window where a lead is warm and nobody has replied yet disappears.",
  },
];
