import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// The public marketing surface (home + legal + auth entry) is crawlable; the
// authenticated app and internal consoles are not. AI crawlers are
// explicitly welcomed on the public pages (AI-search discoverability) and
// held to the same disallow list for the app.
const DISALLOW = ["/app/", "/admin/", "/wholesaler/", "/imo-principal/", "/billing", "/api/"];
const AI_AGENTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
