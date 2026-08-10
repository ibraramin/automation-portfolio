# Nexus Automations - Showcase Site

Client-facing showcase for **Nexus Automations** - an automation services company selling **custom n8n + AI automation across WhatsApp, web, email and phone** to small businesses. Goal: convert visitors into **free automation audit** bookings via live interactive demos + downloadable n8n workflow lead magnets.

**Live repo:** [github.com/ibraramin/automation-portfolio](https://github.com/ibraramin/automation-portfolio)

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4
- tesseract.js (client-side OCR for the invoice demo uploads, lazy-loaded)
- Light/dark themes: manual toggle in header, system-preference default, persisted (demos intentionally stay dark)
- Animated hero workflow pipeline (CSS/JS only, reduced-motion aware)
- Zero backend: all demos run in the browser; contact form uses mailto

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (Turbopack)
npx eslint .     # lint
npx tsc --noEmit # typecheck
```

## Structure

```
app/
  page.tsx              # Home: hero → proof → services → demos → process → CTA
  services/page.tsx     # 6 service lines (outcome-first, no pricing)
  demos/page.tsx        # Demo index
  demos/[slug]/page.tsx # Demo detail (async params, SSG, JSON download)
  contact/page.tsx      # Audit form (mailto)
components/
  site/                 # Header, Footer, CTASection, DemosGrid, ServicesGrid, ...
  demos/                # WhatsAppOrderBot, InvoiceReader, LeadResponse, MeetingMinutesBot,
                        # SpreadsheetRescue, EmailTriage (interactive)
lib/demos.ts            # DemoMeta contract + DEMOS registry (drives /demos grid)
public/downloads/       # n8n workflow JSONs (lead magnets)
docs/plans + docs/specs # Plan + repo/feature specs
```

## How to add a demo

1. Add the entry to `lib/demos.ts` (`slug`, `title`, `tagline`, `markets`, `metric`, `tech`, `jsonFile`, `description`).
2. Build the interactive component in `components/demos/` ("use client", add `data-demo-interacted` on first interaction).
3. Wire it in `app/demos/[slug]/page.tsx` (slug → component map).
4. Drop the matching n8n workflow JSON in `public/downloads/`.

## Brand + contact - one file

Everything (brand name, WhatsApp, email, CTA) lives in `components/site/config.ts`. Contact currently: WhatsApp `wa.me/8801333095960`, email `ibrarshafin2002@gmail.com`.

## Deploy (Cloudflare Pages)

Repo is pushed to GitHub. In Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git → pick `ibraramin/automation-portfolio`** → Framework preset **Next.js** (build `npm run build`, output `.next`) → Deploy. Free tier, no config needed.

## Quality gates

`eslint` clean · `tsc --noEmit` clean · `npm run build` OK (10 routes, 6 SSG demos). Council-reviewed (2 models); all findings resolved.

## Deferred (Phase 2)

OG/social image, analytics on `data-demo-interacted`/`data-json-downloaded`, real form backend, voice AI demo, real case studies, final brand + domain.
