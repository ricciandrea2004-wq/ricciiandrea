import type { MetadataRoute } from "next";

const base = "https://www.competia.work";

// Public pages only. Keep in sync with competia/sitemap/README.md.
const pages: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/prodotto", priority: 0.8 },
  { path: "/prodotto/segnali", priority: 0.7 },
  { path: "/prodotto/fonti", priority: 0.7 },
  { path: "/prodotto/briefing", priority: 0.7 },
  { path: "/chi-siamo", priority: 0.5 },
  { path: "/contatti", priority: 0.5 },
  { path: "/richiedi-accesso", priority: 0.8 },
  { path: "/legale/privacy", priority: 0.2 },
  { path: "/legale/cookie", priority: 0.2 },
  { path: "/legale/termini", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-10-09");
  return pages.map((p) => ({ url: `${base}${p.path}`, lastModified, changeFrequency: "monthly", priority: p.priority }));
}
