// Single source of truth for the public site URL used by metadata,
// canonicals, Open Graph, robots, and the sitemap. Set APP_BASE_URL to the
// public marketing URL in production (the Railway runbook already requires
// it); the fallback only applies to local/dev.
export const SITE_URL = (process.env.APP_BASE_URL ?? "https://caseatlas.app").replace(/\/$/, "");

export const SITE_NAME = "Case Atlas";
export const SITE_TAGLINE = "The strategy engine for the producer who's done guessing.";
export const SITE_DESCRIPTION =
  "Case Atlas is insurance case-design software for life and annuity producers. Type a plain-language client scenario and get a full case design — strategy recommendations from a locked, compliance-filtered library, avatar classification, pitch deck, wholesaler handoff, and pipeline tracking.";
