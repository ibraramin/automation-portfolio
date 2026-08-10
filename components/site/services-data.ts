import type { IconName } from "./icons";

export type Service = {
  id: string;
  icon: IconName;
  title: string;
  outcome: string;
  pain: string;
  build: string;
  tech: string[];
  audience: string;
  accent: "wa" | "sky";
};

export const SERVICES: Service[] = [
  {
    id: "whatsapp-bots",
    icon: "whatsapp",
    title: "WhatsApp order and lead bots",
    outcome: "Never lose an order to a slow reply.",
    pain: "Customers message you on WhatsApp, then go quiet when nobody answers in time.",
    build: "A WhatsApp bot that replies instantly, captures orders and leads, and passes to a human the moment it should.",
    tech: ["n8n", "WhatsApp Business API", "OpenAI"],
    audience: "Restaurants, retailers, clinics — anyone who sells over chat.",
    accent: "wa",
  },
  {
    id: "invoice-extraction",
    icon: "file-text",
    title: "Invoice and document AI extraction",
    outcome: "4 hours of data entry becomes 15 minutes.",
    pain: "Your team retypes invoices, receipts and PDFs into spreadsheets by hand.",
    build: "AI that reads invoices and documents, then files the data into your accounting tools — with a human check when needed.",
    tech: ["n8n", "OpenAI Vision", "Accounting tools"],
    audience: "Accountants, agencies and import / export businesses.",
    accent: "sky",
  },
  {
    id: "lead-response",
    icon: "send",
    title: "Lightning lead response",
    outcome: "Reply in under 5 minutes and book more, faster.",
    pain: "Leads from ads and your website sit cold for hours while competitors answer.",
    build: "An instant alert pipeline that pings your team, sends an auto-reply, and books the call before the lead cools off.",
    tech: ["n8n", "Webhooks", "Google Calendar"],
    audience: "Service businesses that run ads.",
    accent: "wa",
  },
  {
    id: "booking-reminders",
    icon: "calendar",
    title: "Booking and reminders",
    outcome: "Fill your calendar, cut no-shows.",
    pain: "Scheduling happens by back-and-forth messages, and forgotten appointments cost you revenue.",
    build: "A booking flow with automatic confirmations and reminders over WhatsApp and email.",
    tech: ["n8n", "Google Calendar", "WhatsApp"],
    audience: "Salons, clinics and consultancies.",
    accent: "sky",
  },
  {
    id: "crm-sync",
    icon: "database",
    title: "CRM and email sync",
    outcome: "Every lead logged, filed and followed up — automatically.",
    pain: "Leads leak because capturing and follow-up are manual.",
    build: "Every enquiry lands in your CRM, filed correctly and followed up on a schedule you set.",
    tech: ["n8n", "HubSpot", "Gmail"],
    audience: "B2B teams and high-ticket sellers.",
    accent: "sky",
  },
  {
    id: "voice-receptionist",
    icon: "phone",
    title: "Voice AI receptionist",
    outcome: "Answer every call, even after hours.",
    pain: "Missed calls are missed orders — and a human can't pick up at 11 PM.",
    build: "A voice AI that answers calls, takes messages and books jobs around the clock, day or night.",
    tech: ["n8n", "Voice AI", "Twilio"],
    audience: "Trades, clinics and service businesses.",
    accent: "wa",
  },
];
