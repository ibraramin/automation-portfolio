---
plan name: Automation-Portfolio
plan description: Client-ready demo site build
plan status: done
---

## Idea
Build a client-ready portfolio website for a Dhaka-based SMB automation collective (solo founder initially). The site must convert visitors (European SMBs + Bangladeshi SMBs) into "free automation audit" bookings. Strategy from completed market research: custom n8n + AI + WhatsApp builds are the underserved sweet spot in both markets; top-converting portfolio pattern is LIVE interactive demos + downloadable n8n workflow JSONs + outcome-first copy + case-study metrics + no public pricing. Phase 1 of the site: Next.js (App Router, TS, Tailwind), static hosting (Vercel/Cloudflare Pages), 3 core interactive demos — (1) WhatsApp Order Bot with bKash flow (BD market), (2) AI Invoice Reader (EU market), (3) Lightning Lead Response (both markets) — plus services section, downloadable n8n JSON lead magnets, audit-call CTA. Design: dark, modern automation-agency aesthetic, outcome-first copy, mobile-first. Success metrics: demo interaction rate, JSON downloads, audit-call bookings.

## Implementation
- Scaffold Next.js app (TypeScript, Tailwind, App Router, ESLint) in /home/ibrar/Businesss/Ideas2 via create-next-app; verify dev server + production build run clean
- Design system + layout: dark automation-agency theme, hero with outcome-first copy, services section (6 service lines from market research), demos grid, case studies, CTA strip (free audit call), footer; mobile-first responsive
- Build demo 1: WhatsApp Order Bot (BD) — interactive mock WhatsApp chat: product select → size/address → bKash payment instruction → txn ID verification → order confirmed; before/after metric + tech list
- Build demo 2: AI Invoice Reader (EU) — upload or pick sample invoice → client-side extraction (tesseract.js for uploads, ground-truth for samples) → structured fields (vendor, amount, VAT, line items) + validation + log view
- Build demo 3: Lightning Lead Response — input a fake lead message → AI scoring + personalized reply draft + CRM entry + Slack alert timeline; both-market relevance
- Create 3 downloadable n8n workflow JSONs (public/downloads) matching the demos, each with a README line; wire download buttons + interaction tracking hooks (data attributes)
- Integrate pages: home (hero+services+demos+case studies+CTA), /demos (3 live demos), /services, contact/audit form (mailto or formspree placeholder); polish responsive + SEO meta
- Validate: production build + lint clean; dispatch dev council to review site structure, demo UX, copy conversion elements; fix rejections
- Deploy preview to Vercel (or Cloudflare Pages) and hand over: URL, what's deferred (branding/domain, case studies content, remaining 3-5 demos, analytics)
- Write short README in repo documenting structure, how to add a demo, stack + costs

## Required Specs
<!-- SPECS_START -->
- Portfolio-Repo-Spec
- Portfolio-Feature-Spec
<!-- SPECS_END -->