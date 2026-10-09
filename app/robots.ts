import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/api", "/analytics", "/accedi", "/auth", "/invito"] }],
    sitemap: "https://www.competia.work/sitemap.xml",
  };
}
