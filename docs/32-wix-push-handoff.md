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

## How to get it into Wix

**Do NOT attempt `import-claude-design-from-url`** — it requires a publicly
shared Claude artifact, and the owner's plan cannot share artifacts (verified
2026-07-10: "Sharing artifacts is available on Team or Enterprise plans").
External URLs (raw.githubusercontent, githack) are rejected with "Invalid
design URL" — the importer only accepts Claude-hosted links.

**Use `mcp__Wix__WixSiteBuilder`** with a meticulous prompt built from the
actual HTML in `site/` (read the files first — they are the spec):

- Colors: navy #0A1226 · deep space #04070f · gold #D4AF37 · gold-soft
  #E8D9B5 · ivory #F7F5F0 · ink #1c2436.
- Fonts: Playfair Display (serif) for all headlines, Montserrat for body/UI.
- Page 1 (home, client-facing): dark navy hero with constellation/star
  backdrop, eyebrow "PeakBritt Financial Group", H1 "Most firms plan for
  April. We build for 2039." (gold italic "2039."), strategy-name ticker,
  Horizon timeline moment (2026→2039), "When what you've built outgrows
  ordinary planning." (ivory section), "Two clients. One standard." cards,
  "Strategies for complex wealth." 8-card grid + 26/9/100%/1 stat row,
  "Built on a simple conviction." about, testimonial placeholders (keep the
  compliance note), 5-question FAQ, "The future arrives either way. Arrive
  prepared." CTA, contact form, footer with disclosure.
- Page 2 (/advisors): hero "A select group of exceptional producers.",
  Atlas Live terminal demo ($297/month · 30-day money-back), Apply to Join
  panel with 4 criteria, advisor FAQ, Agent Login as the nav button.
- After the builder finishes, use ManageWixSite/CallWixSiteAPI to fix copy
  drift against the HTML files, then publish.

Blog: recreate as Wix blog posts later or keep the generated blog on separate
hosting — do not block the site launch on the 52 articles.

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
