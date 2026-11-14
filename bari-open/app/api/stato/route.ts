import { NextResponse } from "next/server";
import { loadBundle } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

export const dynamic = "force-dynamic";

async function probe(url: string, timeoutMs = 8000): Promise<{ ok: boolean; ms: number; detail?: string }> {
  const started = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    return { ok: res.ok, ms: Date.now() - started, detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - started,
      detail: err instanceof Error ? err.message : "error",
    };
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const bundle = await loadBundle();
  const freshness = freshnessLabel(bundle.syncedAt);

  const [amtab, aria, weather] = await Promise.all([
    probe(`${origin}/api/live/amtab`),
    probe(`${origin}/api/live/aria`),
    probe(`${origin}/api/live/weather`),
  ]);

  return NextResponse.json({
    ok: true,
    syncedAt: bundle.syncedAt,
    freshness,
    summary: bundle.summary,
    live: { amtab, aria, weather },
    checkedAt: new Date().toISOString(),
  });
}
