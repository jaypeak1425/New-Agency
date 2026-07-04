import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Only the public, indexable pages belong in the sitemap — the app,
// admin, and wholesaler trees are noindex/auth-gated.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "weekly"),
    page("/signup", 0.8, "monthly"),
    page("/login", 0.5, "monthly"),
    page("/terms", 0.3, "yearly"),
    page("/privacy", 0.3, "yearly"),
    page("/disclosures", 0.3, "yearly"),
  ];
}
