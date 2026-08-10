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
  title: "Nexus Automations: Automation Solutions for Small Businesses",
  description:
    "Custom automation for small businesses: WhatsApp flows, AI document processing, lead response, booking and CRM sync, built around your workflow. Free automation audit.",
  openGraph: {
    title: "Nexus Automations: Automation Solutions for Small Businesses",
    description:
      "Custom automation for small businesses: WhatsApp flows, AI document processing, lead response, booking and CRM sync, built around your workflow. Free automation audit.",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('nexus-theme');var l=s==='light'||(!s&&matchMedia('(prefers-color-scheme: light)').matches);if(l)document.documentElement.classList.add('light')}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
