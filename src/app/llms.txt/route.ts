import { SITE_URL, SITE_NAME } from "@/lib/seo";

// /llms.txt — the emerging convention (llmstxt.org) for giving LLMs and
// AI-search crawlers a clean, curated summary of what this site is and
// where the key pages live. Served as a route handler so the links resolve
// to the deployed domain.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} is insurance case-design software from Peakbritt Financial Group for licensed life-insurance and annuity producers. A producer types a plain-language client scenario ("I've got a guy…") and gets a full case design: strategy recommendations drawn only from a locked, human-approved library, avatar classification, a compliance-filtered client pitch deck, a wholesaler handoff, and pipeline tracking.

## What it does

- Runs a conversational 10-question intake and classifies the prospect into one of four avatars (High Net Worth, Business Owner, Qualified-Fund-Heavy, Family/Legacy).
- Recommends strategies from a locked library of estate, business-owner, and qualified-money designs — it never invents a strategy, and nine hard tax-law rules are enforced in the engine.
- Generates a client-facing pitch deck where every line passes a compliance filter ("non-taxable," not "tax-free"; no quantified outcome promises).
- Produces a wholesaler handoff with the CPA documentation checklist and an agent-only quantified, current-year federal tax comparison.
- Imports a book of business from CSV, scores and ranks clients by opportunity, and surfaces who to work next.

## Important disclosures

- ${SITE_NAME} is software, not advice. It does not provide tax, legal, accounting, or investment advice.
- Quantified figures are directional, federal-only, and use current-year IRS figures; they must be verified with the client's CPA and the issuing carrier before use.
- Peakbritt Financial Group is not a CPA firm, law firm, or registered investment advisor.

## Pricing

- $297/month, cancel anytime, with a 30-day money-back guarantee. Included at no cost for producers contracted through Peakbritt Financial Group. Later tiers include annual billing and per-seat IMO/BGA white-label licensing.

## Key pages

- Home: ${SITE_URL}/
- Sign up: ${SITE_URL}/signup
- Terms & Conditions: ${SITE_URL}/terms
- Privacy Policy: ${SITE_URL}/privacy
- Accuracy & Disclosures: ${SITE_URL}/disclosures
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
