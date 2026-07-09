// Generates the PeakBritt static blog from the strategy library (the Brain):
//   site/insights/          — client-facing strategy articles → funnel to index.html
//   site/advisor-insights/  — advisor-facing articles → funnel to advisors.html + Atlas
//   site/sitemap.xml, site/robots.txt
//
// Brain lock: only `documented` strategies are published. Every client-facing
// string runs through the compliance filter — a HOLD fails the build; a
// REWRITE publishes the filter's output. Advisor articles tease the strategy
// (why it's used, who it's for, the hook) but never publish the proprietary
// playbook (pitch, objections, COI scripts) — that lives behind the approval
// gate in Case Atlas.
//
// Run: npx tsx scripts/generate-insights.mts

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { strategyLibrarySeed } from "../prisma/strategy-library-data";
import { CLIENT_PITCH } from "../src/lib/pitch-deck-content";
import { CONCEPT_LIBRARY, CATEGORY_LABELS, type ConceptCategory } from "../src/lib/concept-library";
import { SALES_PLAYBOOK } from "../src/lib/sales-playbook";
import { complianceFilter } from "../src/lib/compliance-filter";

const SITE = "https://www.peakbritt.com";
const APP = "https://new-agency-seven.vercel.app";
const OUT = join(import.meta.dirname, "..", "site");

const DISCLOSURE =
  "PeakBritt Financial Group offers insurance and advanced-planning strategies. This article is for general informational purposes only and does not constitute tax, legal, or investment advice; consult your own qualified tax and legal advisors before acting on any strategy. Insurance and annuity products are subject to underwriting, and any benefits or guarantees are based on the claims-paying ability of the issuing insurer and on each policy remaining in force. Strategies described here may not be suitable for every situation.";

function esc(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Client-facing text must clear the filter; HOLD kills the build.
function clientSafe(text: string, context: string): string {
  const result = complianceFilter(text);
  if (result.status === "hold") {
    throw new Error(`Compliance HOLD in ${context}: "${text.slice(0, 80)}"`);
  }
  return result.output;
}

function page(opts: {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  heading: string;
  bodyHtml: string;
  backHref: string;
  backLabel: string;
  ctaHtml: string;
  jsonLd?: object;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="${SITE}${opts.canonicalPath}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0A1226">
<meta property="og:type" content="article">
<meta property="og:site_name" content="PeakBritt Financial Group">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${SITE}${opts.canonicalPath}">
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ""}
<style>
  :root{--navy:#0A1226;--navy-2:#13233D;--gold:#D4AF37;--ivory:#F7F5F0;--ink:#1c2436;--ink-soft:#55607a;
    --serif:"Playfair Display","Didot","Bodoni 72","Hoefler Text",Georgia,serif;
    --sans:"Montserrat","Avenir Next","Avenir",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--ivory);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.7}
  header{background:var(--navy);padding:18px 24px}
  header .wrap{max-width:860px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .bmark{font-family:var(--serif);font-size:20px;letter-spacing:.04em;font-weight:600;color:#fff;text-decoration:none}
  .bmark b{color:var(--gold);font-weight:600}
  header a.back{color:rgba(247,245,240,.72);font-size:12px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
  header a.back:hover{color:var(--gold)}
  main{max-width:860px;margin:0 auto;padding:56px 24px 40px}
  .eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#8f6d1f;font-weight:600}
  h1{font-family:var(--serif);font-weight:500;color:var(--navy);font-size:clamp(2rem,5vw,3rem);line-height:1.1;margin:10px 0 22px;text-wrap:balance}
  h2{font-family:var(--serif);font-weight:500;color:var(--navy);font-size:1.5rem;margin:36px 0 12px}
  p{margin:0 0 16px}
  ul{padding-left:22px;margin:0 0 16px}
  li{margin-bottom:10px}
  .cta{background:var(--navy);border-radius:12px;padding:28px;margin:44px 0 0;color:var(--ivory)}
  .cta h2{color:#fff;margin-top:0}
  .cta p{color:rgba(247,245,240,.8)}
  .btn{display:inline-block;background:var(--gold);color:var(--navy);font-weight:600;font-size:13px;letter-spacing:.12em;text-transform:uppercase;padding:14px 24px;border-radius:6px;text-decoration:none;margin:6px 12px 0 0}
  .btn.ghost{background:transparent;color:var(--ivory);border:1px solid rgba(212,175,55,.5)}
  footer{max-width:860px;margin:0 auto;padding:28px 24px 48px;color:var(--ink-soft);font-size:12.5px;border-top:1px solid #e4ddcd}
  a{color:var(--navy)}
</style>
</head>
<body>
<header><div class="wrap">
  <a class="bmark" href="../index.html">PEAK<b>BRITT</b></a>
  <a class="back" href="${opts.backHref}">${esc(opts.backLabel)}</a>
</div></header>
<main>
  <span class="eyebrow">${esc(opts.eyebrow)}</span>
  <h1>${esc(opts.heading)}</h1>
  ${opts.bodyHtml}
  ${opts.ctaHtml}
</main>
<footer>${DISCLOSURE} &copy; ${new Date().getFullYear()} PeakBritt Financial Group.</footer>
</body>
</html>
`;
}

const documented = strategyLibrarySeed.filter((s) => s.status === "documented");
rmSync(join(OUT, "insights"), { recursive: true, force: true });
rmSync(join(OUT, "advisor-insights"), { recursive: true, force: true });
mkdirSync(join(OUT, "insights"), { recursive: true });
mkdirSync(join(OUT, "advisor-insights"), { recursive: true });

const clientLinks: Array<{ slug: string; title: string; category: ConceptCategory }> = [];
const advisorLinks: Array<{ slug: string; title: string; category: ConceptCategory }> = [];

for (const s of documented) {
  const slug = s.slug as string;
  const name = s.name as string;
  const concept = CONCEPT_LIBRARY[slug];
  const pitch = CLIENT_PITCH[slug];
  const category = concept?.category ?? ("business" as ConceptCategory);

  // ---------- client article (only when a client one-pager narrative exists) ----------
  if (pitch) {
    const approach = clientSafe(pitch.approach, `${slug} approach`);
    const how = pitch.howItWorks.map((t) => clientSafe(t, `${slug} howItWorks`));
    const know = pitch.whatToKnow.map((t) => clientSafe(t, `${slug} whatToKnow`));
    const description = clientSafe(
      `${pitch.clientTitle} — how this planning approach works and what to consider, from PeakBritt Financial Group.`,
      `${slug} meta description`,
    );

    const bodyHtml = `
  <p>${esc(approach)}</p>
  <h2>How it works</h2>
  <ul>${how.map((t) => `<li>${esc(t)}</li>`).join("\n")}</ul>
  <h2>What to know</h2>
  <ul>${know.map((t) => `<li>${esc(t)}</li>`).join("\n")}</ul>`;

    const ctaHtml = `
  <div class="cta">
    <h2>Talk it through with the people who design these plans.</h2>
    <p>A single, confidential conversation is the most valuable thing you can do for what you&rsquo;ve built. No cost. No obligation.</p>
    <a class="btn" href="../index.html#contact">Request a Private Consultation</a>
    <a class="btn ghost" href="../index.html">About PeakBritt</a>
  </div>`;

    writeFileSync(
      join(OUT, "insights", `${slug}.html`),
      page({
        title: `${pitch.clientTitle} | PeakBritt Insights`,
        description,
        canonicalPath: `/insights/${slug}.html`,
        eyebrow: `Insights · ${CATEGORY_LABELS[category]}`,
        heading: pitch.clientTitle,
        bodyHtml,
        backHref: "index.html",
        backLabel: "All Insights",
        ctaHtml,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pitch.clientTitle,
          description,
          author: { "@type": "Organization", name: "PeakBritt Financial Group" },
          publisher: { "@type": "Organization", name: "PeakBritt Financial Group" },
          mainEntityOfPage: `${SITE}/insights/${slug}.html`,
        },
      }),
    );
    clientLinks.push({ slug, title: pitch.clientTitle, category });
  }

  // ---------- advisor article ----------
  const playbook = SALES_PLAYBOOK[slug];
  const advisorBody = `
  <p>${esc(String(s.whyUsed ?? ""))}</p>
  <h2>The client who triggers it</h2>
  <p>${esc(String(s.clientTriggerProfile ?? ""))}</p>
  ${playbook ? `<h2>Why it sells</h2>\n  <p>${esc(playbook.hook)}</p>` : ""}
  <h2>What Atlas hands you</h2>
  <p>Inside Case Atlas, this strategy carries the full field kit: the compliant positioning, the
  word-for-word pitch, the objection responses, the COI script, the client one-pager, and the ten
  questions a CPA will ask &mdash; plus the hard-rule gates that keep the design clean. Describe the
  client in plain language and Atlas assembles the case.</p>`;

  const advisorCta = `
  <div class="cta">
    <h2>Run this case from a decade ahead.</h2>
    <p>The full playbook &mdash; pitch, objections, COI scripts, and the case engine &mdash; opens after a personal review. Apply once; you&rsquo;ll hear back within a business day.</p>
    <a class="btn" href="${APP}/signup" rel="noopener">Apply to Join</a>
    <a class="btn ghost" href="../advisors.html">For Advisors</a>
    <a class="btn ghost" href="${APP}/login" rel="noopener">Agent Login</a>
  </div>`;

  const advisorDescription = `How top producers position ${name} — the trigger profile, the hook, and the field kit inside Case Atlas.`;

  writeFileSync(
    join(OUT, "advisor-insights", `${slug}.html`),
    page({
      title: `${name} — Advisor Playbook Notes | PeakBritt`,
      description: advisorDescription,
      canonicalPath: `/advisor-insights/${slug}.html`,
      eyebrow: `Advisor Insights · ${CATEGORY_LABELS[category]}`,
      heading: name,
      bodyHtml: advisorBody,
      backHref: "index.html",
      backLabel: "All Advisor Insights",
      ctaHtml: advisorCta,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `${name} — Advisor Playbook Notes`,
        description: advisorDescription,
        author: { "@type": "Organization", name: "PeakBritt Financial Group" },
        publisher: { "@type": "Organization", name: "PeakBritt Financial Group" },
        mainEntityOfPage: `${SITE}/advisor-insights/${slug}.html`,
      },
    }),
  );
  advisorLinks.push({ slug, title: name, category });
}

// ---------- index pages ----------
function indexPage(opts: {
  title: string;
  description: string;
  canonicalPath: string;
  eyebrow: string;
  heading: string;
  intro: string;
  links: Array<{ slug: string; title: string; category: ConceptCategory }>;
  backHref: string;
  backLabel: string;
  ctaHtml: string;
}) {
  const byCategory = new Map<ConceptCategory, Array<{ slug: string; title: string }>>();
  for (const l of opts.links) {
    if (!byCategory.has(l.category)) byCategory.set(l.category, []);
    byCategory.get(l.category)!.push(l);
  }
  const bodyHtml = `
  <p>${esc(opts.intro)}</p>
  ${[...byCategory.entries()]
    .map(
      ([cat, items]) => `
  <h2>${esc(CATEGORY_LABELS[cat])}</h2>
  <ul>${items.map((i) => `<li><a href="${i.slug}.html">${esc(i.title)}</a></li>`).join("\n")}</ul>`,
    )
    .join("\n")}`;
  return page({ ...opts, bodyHtml });
}

writeFileSync(
  join(OUT, "insights", "index.html"),
  indexPage({
    title: "Insights — Planning Strategies Explained | PeakBritt Financial Group",
    description:
      "Plain-language explanations of the advanced planning strategies we design for high-net-worth families and business owners.",
    canonicalPath: "/insights/index.html",
    eyebrow: "PeakBritt Insights",
    heading: "Planning strategies, explained plainly.",
    intro:
      "Each article explains one planning approach in plain language — how it works and what to consider. When one sounds like your situation, the next step is a confidential conversation.",
    links: clientLinks,
    backHref: "../index.html",
    backLabel: "PeakBritt Home",
    ctaHtml: `
  <div class="cta">
    <h2>Not sure which applies to you?</h2>
    <p>That&rsquo;s the point of a first conversation. No cost. No obligation. Only clarity.</p>
    <a class="btn" href="../index.html#contact">Request a Private Consultation</a>
  </div>`,
  }),
);

writeFileSync(
  join(OUT, "advisor-insights", "index.html"),
  indexPage({
    title: "Advisor Insights — Strategy Playbook Notes | PeakBritt",
    description:
      "How top producers position advanced strategies — trigger profiles, hooks, and the field kit inside Case Atlas. For licensed advisors.",
    canonicalPath: "/advisor-insights/index.html",
    eyebrow: "Advisor Insights",
    heading: "The cases most producers walk past.",
    intro:
      "One article per strategy in the locked library: who triggers it, why it sells, and what the Case Atlas field kit hands you. The full playbook — pitch, objections, COI scripts — opens after approval.",
    links: advisorLinks,
    backHref: "../advisors.html",
    backLabel: "For Advisors",
    ctaHtml: `
  <div class="cta">
    <h2>Get the whole playbook.</h2>
    <p>Case design, mentorship, and the platform we use ourselves &mdash; by application.</p>
    <a class="btn" href="${APP}/signup" rel="noopener">Apply to Join</a>
    <a class="btn ghost" href="../advisors.html">For Advisors</a>
  </div>`,
  }),
);

// ---------- sitemap + robots ----------
const urls: Array<{ loc: string; priority: string }> = [
  { loc: `${SITE}/`, priority: "1.0" },
  { loc: `${SITE}/advisors.html`, priority: "0.9" },
  { loc: `${SITE}/insights/index.html`, priority: "0.8" },
  { loc: `${SITE}/advisor-insights/index.html`, priority: "0.8" },
  ...clientLinks.map((l) => ({ loc: `${SITE}/insights/${l.slug}.html`, priority: "0.7" })),
  ...advisorLinks.map((l) => ({ loc: `${SITE}/advisor-insights/${l.slug}.html`, priority: "0.6" })),
];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`,
);
writeFileSync(
  join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

console.log(
  `generated: ${clientLinks.length} client articles, ${advisorLinks.length} advisor articles, 2 indexes, sitemap (${urls.length} URLs), robots.txt`,
);
