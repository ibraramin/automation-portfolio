> **Pivot (2026-08-27): unified 00-omni-chat-core is the main build — specs 01–10 subsumed for traceability (04 is a superseded slice), 11 remains separate.**
> See `docs/specs/Omni-Unified-Spec.md` · `docs/plans/Omni-Unified.md` · `blueprints/README.md`.

# Nexus Automations - Showcase Site

Client-facing showcase for **Nexus Automations** - an automation services company selling **custom n8n + AI automation across WhatsApp, web, email and phone** to small businesses. Goal: convert visitors into **free automation audit** bookings via live interactive demos + downloadable n8n workflow lead magnets.

**Live repo:** [github.com/ibraramin/automation-portfolio](https://github.com/ibraramin/automation-portfolio)

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4
- tesseract.js (client-side OCR for the invoice demo uploads, lazy-loaded)
- Light/dark themes: manual toggle in header, system-preference default, persisted (demos intentionally stay dark)
- Animated hero workflow pipeline (CSS/JS only, reduced-motion aware)
- Zero backend: all demos run in the browser; contact form posts to Web3Forms with a mailto fallback until an access key is set

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
  services/page.tsx     # 11 service lines (outcome-first, no pricing, driven by services-data.ts)
  demos/page.tsx        # Demo index
  demos/[slug]/page.tsx # Demo detail (async params, SSG, JSON download)
  contact/page.tsx      # Audit form (Web3Forms + mailto fallback)
components/
  site/                 # Header, Footer, CTASection, DemosGrid, ServicesGrid, ...
  demos/                # WhatsAppOrderBot, InvoiceReader, LeadResponse, MeetingMinutesBot,
                        # SpreadsheetRescue, EmailTriage (interactive)
lib/demos.ts            # DemoMeta contract + DEMOS registry (drives /demos grid)
public/downloads/       # n8n workflow JSONs (lead magnets)
docs/plans + docs/specs # Plan + repo/feature specs
blueprints/               # Service spec-sheet library (11 sheets) → tested n8n blueprints
```

## How to add a demo

1. Add the entry to `lib/demos.ts` (`slug`, `title`, `tagline`, `markets`, `metric`, `tech`, `jsonFile`, `description`).
2. Build the interactive component in `components/demos/` ("use client", add `data-demo-interacted` on first interaction).
3. Wire it in `app/demos/[slug]/page.tsx` (slug → component map).
4. Drop the matching n8n workflow JSON in `public/downloads/`.

## Brand + contact - one file

Everything (brand name, WhatsApp, email, CTA) lives in `components/site/config.ts`. Contact currently: WhatsApp `wa.me/8801333095960`, email `ibrarshafin2002@gmail.com`.

## Deploy (Cloudflare Workers static assets)

The site is a fully static export (`output: "export"` in `next.config.ts`): `next build` emits plain HTML/CSS/JS into `out/`. Cloudflare Workers serves those files directly through the `assets` setting in `wrangler.jsonc` (`assets.directory = "./out"`, with `not_found_handling: "404-page"`).

```bash
npm run deploy   # runs npm run build && wrangler deploy
```

Note: `npm run start` is **not available** with a static export. There is no Node server to start; the `out/` directory is the deployable artifact. For local preview of the export, serve the folder with any static server (for example `npx serve out`).

## Quality gates

`eslint` clean · `tsc --noEmit` clean · `npm run build` OK (14 routes, 6 SSG demos, /privacy). Council-reviewed; all findings resolved.

## Deferred (Phase 2)

Analytics on `data-demo-interacted`/`data-json-downloaded`, voice AI demo, demos for the five newest services (support triage, prospect outbound, review management, e-commerce ops, automation debugging), real case studies, final brand + domain, tesseract asset self-hosting, branded email alias.
