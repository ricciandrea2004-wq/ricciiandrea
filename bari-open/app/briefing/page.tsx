import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/SiteHeader";
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

  return (
    <section className="section briefing-page" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "52rem" }}>
        <div className="page-hero briefing-hero">
          <p className="section__eyebrow">Sintesi operativa</p>
          <h1>Briefing settimanale mobilità — Bari</h1>
          <p className="section__lead">
            Lettura dei flussi e della sicurezza stradale da open data comunali. Data briefing:{" "}
            <strong>{romeTodayLabel()}</strong> (Europe/Rome). Sync dataset: {synced}.
          </p>
          <div className="cta-row no-print">
            <PrintButton label="Stampa / salva PDF" />
            <Link className="btn btn--ghost-dark" href="/mappa">
              Apri la mappa
            </Link>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.35rem" }}>Cinque finding</h2>
          <ol className="briefing-findings">
            {findings.map((finding, i) => (
              <li key={`${i}-${finding.slice(0, 24)}`}>{finding}</li>
            ))}
          </ol>
          <p className="muted" style={{ marginBottom: 0 }}>
            Profilo settimanale (media passaggi): feriali{" "}
            <strong>{formatNumber(profile.weekdayAvg)}</strong> · weekend{" "}
            <strong>{formatNumber(profile.weekendAvg)}</strong>.
          </p>
        </div>

        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.35rem" }}>Anomalie di traffico</h2>
          <p className="muted">
            Incroci con scostamento rilevante rispetto al baseline recente. Clicca per aprirli in
            mappa.
          </p>
          {insights.trafficAnomalies.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>
              Nessuna anomalia in evidenza sul calcolo attuale.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Incrocio</th>
                  <th>Codice</th>
                  <th>Scostamento</th>
                  <th>Media recente</th>
                  <th>Baseline</th>
                </tr>
              </thead>
              <tbody>
                {insights.trafficAnomalies.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>{row.name}</Link>
                    </td>
                    <td>{row.code || "—"}</td>
                    <td>
                      {row.pctDeviation > 0 ? "+" : ""}
                      {row.pctDeviation.toFixed(1)}%
                    </td>
                    <td>{formatNumber(row.recentAvg)}</td>
                    <td>{formatNumber(row.baselineMedian)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.35rem" }}>Hotspot sicurezza</h2>
          <p className="muted">
            Punti con più incidenti con lesioni nelle vicinanze, in rapporto al traffico locale.
          </p>
          {insights.safetyHotspots.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>
              Nessun hotspot in evidenza sul calcolo attuale.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Incrocio</th>
                  <th>Codice</th>
                  <th>Lesioni vicine</th>
                  <th>Traffico</th>
                </tr>
              </thead>
              <tbody>
                {insights.safetyHotspots.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>{row.name}</Link>
                    </td>
                    <td>{row.code || "—"}</td>
                    <td>{formatNumber(row.injuryAccidents)}</td>
                    <td>{formatNumber(row.trafficTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
