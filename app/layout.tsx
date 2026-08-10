import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexus Automations — Custom automation for small businesses (Dhaka to Europe)",
  description:
    "Custom WhatsApp, AI and workflow automation for small businesses. Built in Dhaka, delivered in your timezone. Free automation audit.",
  openGraph: {
    title: "Nexus Automations — Custom automation for small businesses",
    description:
      "Custom WhatsApp, AI and workflow automation for small businesses. Built in Dhaka, delivered in your timezone. Free automation audit.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
