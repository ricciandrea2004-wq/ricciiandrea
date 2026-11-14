import { NextResponse } from "next/server";
import { formatDateIt, formatNumber, getInsights, loadBundle } from "@/lib/data";
import { cityMomDelta, injuryRatePct } from "@/lib/metrics";

export const dynamic = "force-static";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") || 7);
  const windowDays = [7, 14, 30].includes(days) ? days : 7;

  const bundle = await loadBundle();
  const insights = getInsights(bundle);
  const mom = cityMomDelta(bundle);
  const injuryPct = injuryRatePct(bundle);
  const today = formatDateIt(new Date().toISOString().slice(0, 10));

  const lines = [
    `# Briefing mobilità Bari — finestra ${windowDays} giorni`,
    ``,
    `Generato: ${today} · Sync dataset: ${formatDateIt(bundle.syncedAt.slice(0, 10))}`,
    ``,
    `## Finding`,
    ...insights.briefingFindings.map((f, i) => `${i + 1}. ${f}`),
    ``,
    `## KPI`,
    `- Media città: ${formatNumber(bundle.summary.cityDailyAvg)} passaggi/giorno`,
    `- MoM (${mom.previousMonth} → ${mom.currentMonth}): ${
      mom.pctDelta == null ? "n/d" : `${mom.pctDelta >= 0 ? "+" : ""}${mom.pctDelta.toFixed(1)}%`
    }`,
    `- Tasso lesioni: ${injuryPct.toFixed(1)}% (${formatNumber(bundle.summary.injuryAccidents)}/${formatNumber(bundle.summary.accidentCount)})`,
    ``,
    `## Anomalie`,
    ...insights.trafficAnomalies.map(
      (a) =>
        `- ${a.code} ${a.name}: ${a.pctDeviation >= 0 ? "+" : ""}${a.pctDeviation.toFixed(1)}%`,
    ),
    ``,
    `## Hotspot sicurezza`,
    ...insights.safetyHotspots.map(
      (h) =>
        `- ${h.code} ${h.name}: ${h.injuryAccidents} lesioni vicine · traffico ${formatNumber(h.trafficTotal)}`,
    ),
    ``,
    `_Vista Bari · open data Comune di Bari_`,
    ``,
  ];

  const md = lines.join("\n");
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="vista-bari-briefing-${windowDays}d.md"`,
    },
  });
}
