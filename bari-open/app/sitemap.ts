import type { MetadataRoute } from "next";

const ROUTES = [
  "/",
  "/mappa",
  "/andamento",
  "/sicurezza",
  "/briefing",
  "/briefing/email",
  "/ora",
  "/stato",
  "/fonti",
  "/per-il-comune",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://vista-bari.example";
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/ora" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.7,
  }));
}
