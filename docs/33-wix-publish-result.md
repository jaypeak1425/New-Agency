# Wix push — result log (2026-07-10/11, follow-up to docs/32)

## Where things landed

- **Live site (the keeper):** https://jaypeak1425.wixsite.com/peakbritt-financia-3
  — siteId `2eaa9d67-9d8b-4bf8-b103-db3d6248b288`, display name renamed to
  "Peakbritt Financial", published. Built by WixSiteBuilder job
  `4fce541e-d636-4be9-95ba-00afdcc0e21e` from a design-first prompt (living
  constellation, Playfair scale, gold year dial, PB monogram, Atlas terminal).
- **Trashed (recoverable from Wix trash bin):** the old generic site
  `peakbritt-financial` (fe0f6769), orphan draft "Peakbritt Financia 1"
  (d96a6a25), first rebuild "Peakbritt Financia 2" (dd9307e3).
- **URL slug caveat:** the free wixsite.com slug (`/peakbritt-financia-3`) has
  NO public API to change it. Manual fix: manage.wix.com → My Sites → Site
  Actions → Rename → republish; the free URL follows the new name. Becomes moot
  once www.peakbritt.com is connected (needs Premium).

## Lessons for the next session (hard-won, don't rediscover)

1. **WixSiteBuilder cannot edit a COMPLETED job.** Passing the old jobId back
   with an edit prompt returns "build started" but is a silent no-op (job
   record and site both unchanged). Iteration = new build = new site + new
   staging URL every time. Budget ~4–18 min per build; it sometimes retries
   internally and leaves an orphan draft site (delete later).
2. **sitePrompt hard limit 6000 chars.** Put the DESIGN SYSTEM first and the
   exact headline copy in quotes; compress body copy — the builder paraphrases
   it anyway and copy drift gets fixed afterward.
3. **The builder approximates; it does not clone.** It will not reproduce the
   hand-coded canvas constellation/cursor physics from `site/index.html`
   exactly. Owner chose (2026-07-11) to keep iterating in Wix rather than host
   the raw HTML. The raw-HTML option (exact match) remains: deploy `site/` to
   static hosting; Wix import-from-URL stays blocked (Claude artifact sharing
   unavailable on plan; external URLs rejected).
4. **This sandbox cannot see wixsite.com or wixmp.com** (network policy 403 on
   CONNECT; WebFetch also 403). The owner must eyeball every build — send them
   the previewUrl and ask for screenshots of what's off.
5. **Useful APIs (verified working via MCP):**
   - Bulk delete (to trash): `POST https://www.wixapis.com/site-actions/v1/bulk/sites/delete` `{"ids":[...]}`
   - Rename display name: `POST https://www.wixapis.com/site-properties/v4/properties/business-profile`
     `{"businessProfile":{"siteDisplayName":"..."},"fields":{"paths":["siteDisplayName"]}}` (site-scoped)
   - Publish: `POST https://www.wixapis.com/site-publisher/v1/site/publish` (site-scoped)
   - List sites: `POST https://www.wixapis.com/site-list/v2/sites/query`
   - Poll builds: `pullSiteCreationJob(jobId)` — data.previewUrl/editorUrl/siteId appear on completion.

## Still open (from docs/32 must-holds)

- Owner visual check of financia-3 vs `site/index.html` reference (type scale,
  moving constellation, HUD strip, dial) — iterate with new builds as needed.
- Copy-drift pass against `site/*.html`; verify "no cost" (never "free"), no
  Case Atlas on the client page, footer disclosure verbatim, contact-form
  notifications wired to owner email.
- Legal pages (privacy/terms/accessibility) not yet created on Wix.
- Blog (52 articles) intentionally not migrated — see docs/32.
- Slug rename to `/peakbritt-financial` (manual, see above) or connect real
  domain later.
