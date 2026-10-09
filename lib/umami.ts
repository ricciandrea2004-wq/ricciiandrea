// Umami read API for the internal /analytics page. Server-only: the key never reaches the browser.
// Umami Cloud: UMAMI_API_URL=https://api.umami.is/v1 and UMAMI_API_KEY.
// Self-hosted: UMAMI_API_URL=https://<host>/api and UMAMI_API_TOKEN (bearer).

export type Range = "24h" | "7d";
export type Point = { x: string; y: number };
export type Analytics = {
  range: Range;
  active: number;
  pageviews: number;
  visitors: number;
  visits: number;
  bounceRate: number | null;
  avgVisitSeconds: number | null;
  series: Point[];
  fetchedAt: string;
};
export type AnalyticsResult = { ok: true; data: Analytics } | { ok: false; issue: "not-configured" | "unavailable" | "invalid-response" };

const TIMEOUT_MS = 5000;

function config() {
  const base = process.env.UMAMI_API_URL?.replace(/\/$/, "");
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY;
  const token = process.env.UMAMI_API_TOKEN;
  if (!base || !websiteId || (!apiKey && !token)) return null;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-umami-api-key"] = apiKey;
  else headers.Authorization = `Bearer ${token}`;
  return { base, websiteId, headers };
}

export function isConfigured() {
  return config() !== null;
}

// Umami returns either plain numbers or { value, prev } depending on the version.
function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "value" in v && typeof (v as { value: unknown }).value === "number") {
    return (v as { value: number }).value;
  }
  return 0;
}

export async function getAnalytics(range: Range): Promise<AnalyticsResult> {
  const cfg = config();
  if (!cfg) return { ok: false, issue: "not-configured" };

  const endAt = Date.now();
  const startAt = endAt - (range === "24h" ? 24 : 24 * 7) * 3600 * 1000;
  const unit = range === "24h" ? "hour" : "day";
  const site = `${cfg.base}/websites/${encodeURIComponent(cfg.websiteId)}`;
  const q = `startAt=${startAt}&endAt=${endAt}`;

  const get = async (path: string) => {
    const res = await fetch(`${site}${path}`, {
      headers: cfg.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`umami-${res.status}`);
    return res.json() as Promise<Record<string, unknown>>;
  };

  let stats: Record<string, unknown>, views: Record<string, unknown>, active: Record<string, unknown>;
  try {
    [stats, views, active] = await Promise.all([
      get(`/stats?${q}`),
      get(`/pageviews?${q}&unit=${unit}&timezone=Europe%2FRome`),
      get(`/active`),
    ]);
  } catch {
    return { ok: false, issue: "unavailable" };
  }

  const series = Array.isArray(views.pageviews) ? (views.pageviews as Point[]) : null;
  if (!series) return { ok: false, issue: "invalid-response" };

  const visits = num(stats.visits);
  const bounces = num(stats.bounces);
  const totaltime = num(stats.totaltime);

  return {
    ok: true,
    data: {
      range,
      active: num(active.visitors ?? active.x),
      pageviews: num(stats.pageviews),
      visitors: num(stats.visitors),
      visits,
      bounceRate: visits > 0 ? bounces / visits : null,
      avgVisitSeconds: visits > 0 ? totaltime / visits : null,
      series: series.map((p) => ({ x: String(p.x), y: Number(p.y) || 0 })),
      fetchedAt: new Date().toISOString(),
    },
  };
}
