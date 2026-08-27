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
  accent: "accent" | "sky";
};

export const SERVICES: Service[] = [
  {
    id: "omni-capture",
    icon: "message",
    title: "Order and lead capture, every channel",
    outcome: "Most enquiries answered in seconds, whichever app it lands on.",
    pain: "Orders and leads arrive on WhatsApp, web forms, Messenger and email, and replies slip through the cracks.",
    build: "One inbox that collects every channel, answers instantly with what customers ask for, and hands hot conversations to your team.",
    tech: ["n8n", "WhatsApp Business API", "Webhooks", "OpenAI"],
    audience: "Retailers, restaurants and service businesses that sell across apps.",
    accent: "accent",
  },
  {
    id: "doc-processing",
    icon: "file-text",
    title: "AI document processing",
    outcome: "Invoices, receipts and contracts file themselves.",
    pain: "Your team retypes paperwork into spreadsheets and folders by hand.",
    build: "AI that reads any document, extracts the fields you need, validates them and files everything into your accounting tools.",
    tech: ["n8n", "OpenAI Vision", "tesseract.js", "Accounting tools"],
    audience: "Accounting firms, agencies and professional services.",
    accent: "sky",
  },
  {
    id: "lead-response",
    icon: "zap",
    title: "Lightning lead response",
    outcome: "Reply in under five minutes and win more deals.",
    pain: "Leads sit cold for hours while competitors answer first.",
    build: "An instant pipeline that scores every lead, drafts a personalized reply, saves it to your CRM and alerts your team on Slack.",
    tech: ["n8n", "OpenAI", "HubSpot", "Slack"],
    audience: "B2B teams and businesses that run ads.",
    accent: "accent",
  },
  {
    id: "booking-reminders",
    icon: "calendar",
    title: "Bookings and no-show recovery",
    outcome: "Fill your calendar and cut missed appointments.",
    pain: "Scheduling happens in scattered messages, and forgotten bookings cost you money.",
    build: "A booking flow with confirmations and reminders over any channel, plus automatic rebooking for no-shows.",
    tech: ["n8n", "Google Calendar", "WhatsApp", "Email"],
    audience: "Salons, clinics and consultancies.",
    accent: "sky",
  },
  {
    id: "voice-receptionist",
    icon: "phone",
    title: "Voice AI receptionist",
    outcome: "Calls answered around the clock, including nights.",
    pain: "Missed calls are missed orders, and no human can pick up around the clock.",
    build: "A voice AI that answers calls, takes messages and books jobs any hour, transferring to a human the moment it should.",
    tech: ["n8n", "Voice AI", "Twilio"],
    audience: "Trades, clinics and service businesses.",
    accent: "accent",
  },
  {
    id: "reporting-ops",
    icon: "server",
    title: "Reporting and ops automation",
    outcome: "Weekly numbers arrive without the weekly scramble.",
    pain: "Metrics live in messy spreadsheets, and reports take a whole afternoon to assemble.",
    build: "AI that turns raw data into branded reports, rescues messy spreadsheets and turns meeting recordings into minutes.",
    tech: ["n8n", "OpenAI", "Notion", "Google Sheets"],
    audience: "Founders, agency leads and operations teams.",
    accent: "sky",
  },
];
