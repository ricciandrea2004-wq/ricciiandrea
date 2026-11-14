import { NextResponse } from "next/server";
import { getInsights, loadBundle } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";
import {
  cityMomDelta,
  deviceTrends,
  injuryRatePct,
  topIntersectionsExport,
} from "@/lib/metrics";

export const dynamic = "force-static";

export async function GET() {
  const bundle = await loadBundle();
  const insights = getInsights(bundle);
  const freshness = freshnessLabel(bundle.syncedAt);
  const mom = cityMomDelta(bundle);
  const trends = deviceTrends(bundle, 5);

  return NextResponse.json(
    {
      ok: true,
      syncedAt: bundle.syncedAt,
      freshness,
      summary: bundle.summary,
      injuryRatePct: injuryRatePct(bundle),
      mom,
      topIntersections: topIntersectionsExport(bundle, 15),
      improving: trends.improving,
      worsening: trends.worsening,
      anomalies: insights.trafficAnomalies,
      hotspots: insights.safetyHotspots,
      weekdayWeekend: insights.weekdayWeekendProfile,
      briefingFindings: insights.briefingFindings,
      sources: bundle.sources,
      districtsAvailable: Boolean(bundle.districts?.features?.length),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
