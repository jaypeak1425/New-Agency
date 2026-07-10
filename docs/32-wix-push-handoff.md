# Wix push — session handoff (written 2026-07-10)

Purpose: a fresh Claude session (with the Wix connector attached) publishes the
PeakBritt marketing site to Wix. Everything is prebuilt in this repo — do not
rebuild content, just get it into Wix faithfully.

## What to publish

Source of truth: the `site/` folder on branch `claude/new-session-ollg4p`.

- `site/index.html` — CLIENT-facing main page (dark navy/gold, constellation,
  hero "Most firms plan for April. We build for 2039.", Horizon dial, Two
  clients. One standard., strategy grid, About, testimonials-placeholder, FAQ,
  contact form). NO advisor or Case Atlas content belongs on this page.
- `site/advisors.html` — ADVISOR page (hero "A select group of exceptional
  producers.", Atlas Live terminal demo at $297/mo, Apply to Join panel,
  advisor FAQ, Agent Login as nav CTA).
- `site/insights/` — 26 client blog articles + index (funnel → consultation).
- `site/advisor-insights/` — 26 advisor articles + index (funnel → apply/login).
- `site/privacy.html`, `site/terms.html`, `site/accessibility.html` — legal.
- `site/og-image.png` — social share image.

## How to get it into Wix (in order of fidelity)

1. **Design import**: `mcp__Wix__import-claude-design-from-url` accepts a
   publicly fetchable Claude design URL. The design artifact is
   https://claude.ai/code/artifact/a8cdd975-d079-4837-ba91-14eb7e21c3db
   ("peakbritt-site"). It must be SHARED PUBLICLY first (owner opens it →
   Share → anyone with the link) — private artifact URLs are rejected with
   "Invalid design URL". Note: the artifact holds the OLDER single-page
   version; after import, split content per the two-page structure above.
2. **WixSiteBuilder** with a detailed prompt reproducing the two pages
   (colors: navy #0A1226 / space #04070f, gold #D4AF37, ivory #F7F5F0;
   fonts: Playfair Display headlines, Montserrat body).
3. Wix blog: recreate the two Insights collections as Wix blog categories, or
   defer the blog (it can live later on a subdomain).

## Must-hold requirements

- Client page carries ZERO Case Atlas/advisor content ("Case Atlas" appears
  nowhere on it). Advisor pitch lives only on the advisors page.
- Wording is always "no cost", never "free". Never mention CRI or Level Four.
- Links: Agent Login → https://new-agency-seven.vercel.app/login ·
  Apply to Join → https://new-agency-seven.vercel.app/signup
  (update to app.peakbritt.com equivalents once the domain exists).
- Contact form fields: Name, Email, "I am a…" (client / business owner),
  message. Wire Wix form notifications to the owner's email.
- Footer must keep the compliance disclosure paragraph (copy it from
  site/index.html) and link Privacy/Terms/Accessibility pages.
- SEO: set page titles/descriptions from the <head> of each HTML file; submit
  the Wix-generated sitemap in Search Console once the domain is connected.

## Existing Wix state

- The Wix account already has a generic site at
  jaypeak1425.wixsite.com/peakbritt-financial (built 2026-07-09 by
  WixSiteBuilder from an early prompt — WRONG positioning, client page must
  replace it or a new site created and the old one deleted).
- A WixSiteBuilder job from 2026-07-09 exists: id
  bde59cd7-d2cc-4977-aead-cd1eed52ad74 (that generic site).

## What Wix does NOT host

Case Atlas (the Next.js app) stays on Vercel (project "new-agency", currently
paused via vercel.json git.deploymentEnabled=false) with its Postgres on
Railway. Wix hosts marketing pages only. The weekly blog automation
(.github/workflows/refresh-insights.yml) regenerates site/ content in the
repo — if the blog lives inside Wix, new articles need a manual re-import, so
consider keeping the blog on separate hosting later.
