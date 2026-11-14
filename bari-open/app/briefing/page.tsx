import type { Metadata } from "next";
import { BriefingClient } from "@/components/BriefingClient";
import { formatDateIt, formatNumber, getInsights, loadBundle } from "@/lib/data";

export const metadata: Metadata = {
  title: "Briefing settimanale",
};

function romeTodayLabel(): string {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(new Date());
}

export default async function BriefingPage() {
  const bundle = await loadBundle();
  const insights = getInsights(bundle);
  const findings = insights.briefingFindings.slice(0, 5);
  const profile = insights.weekdayWeekendProfile;
  const synced = formatDateIt(bundle.syncedAt.slice(0, 10));
  const profileLabel = `Profilo settimanale (media passaggi): feriali ${formatNumber(profile.weekdayAvg)} · weekend ${formatNumber(profile.weekendAvg)}.`;

  return (
    <section className="section briefing-page" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "52rem" }}>
        <BriefingClient
          findings={findings}
          anomalies={insights.trafficAnomalies}
          hotspots={insights.safetyHotspots}
          profileLabel={profileLabel}
          syncedLabel={synced}
          dateLabel={romeTodayLabel()}
        />
      </div>
    </section>
  );
}
