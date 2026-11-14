import type { Metadata } from "next";
import Link from "next/link";
import { SparkBars } from "@/components/SparkBars";
import {
  formatDateIt,
  formatNumber,
  getCitySeries,
  getInsights,
  getTopDevices,
  loadBundle,
} from "@/lib/data";
import { cityMomDelta, deviceTrends, weekdayWeekendSeries } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Andamento",
};

export default async function AndamentoPage() {
  const bundle = await loadBundle();
  const city = getCitySeries(bundle);
  const top = getTopDevices(bundle, 10);
  const mom = cityMomDelta(bundle);
  const trends = deviceTrends(bundle, 5);
  const { weekday, weekend } = weekdayWeekendSeries(bundle);
  const profile = getInsights(bundle).weekdayWeekendProfile;

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="section__eyebrow">Flussi</p>
          <h1>Andamento cittadino</h1>
          <p className="section__lead">
            Somma dei passaggi rilevati dalle spire su tutti gli impianti, giorno per giorno.
            Media città: {formatNumber(bundle.summary.cityDailyAvg)} veicoli/giorno.
          </p>
          <div className="cta-row">
            <a className="btn btn--primary" href="/api/export/intersections?limit=25">
              Esporta CSV top incroci
            </a>
            <a className="btn btn--ghost-dark" href="/api/export/summary">
              JSON summary API
            </a>
          </div>
        </div>

        <div className="stat-strip" style={{ marginBottom: "1.5rem" }}>
          <div className="stat">
            <strong>
              {mom.pctDelta == null
                ? "—"
                : `${mom.pctDelta >= 0 ? "+" : ""}${mom.pctDelta.toFixed(1)}%`}
            </strong>
            <span>
              MoM traffico città ({mom.previousMonth || "n/d"} → {mom.currentMonth || "n/d"})
            </span>
          </div>
          <div className="stat">
            <strong>{formatNumber(profile.weekdayAvg)}</strong>
            <span>media feriale</span>
          </div>
          <div className="stat">
            <strong>{formatNumber(profile.weekendAvg)}</strong>
            <span>media weekend</span>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Serie giornaliera</h2>
          <p className="muted">
            {city.length} giorni · sync {formatDateIt(bundle.syncedAt.slice(0, 10))}
          </p>
          {city.length === 0 ? (
            <p className="muted empty-inline">Nessuna serie flussi disponibile.</p>
          ) : (
            <SparkBars series={city} maxBars={45} />
          )}
        </div>

        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Feriali vs weekend</h2>
          <p className="muted">
            Confronto delle medie giornaliere: {weekday.length} giorni feriali, {weekend.length}{" "}
            weekend.
          </p>
          <div className="ww-grid">
            <div>
              <p className="section__eyebrow">Feriali</p>
              <SparkBars series={weekday} maxBars={30} />
            </div>
            <div>
              <p className="section__eyebrow">Weekend</p>
              <SparkBars series={weekend} maxBars={30} />
            </div>
          </div>
        </div>

        <div className="trends-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="panel">
            <h2 style={{ fontSize: "1.25rem" }}>In miglioramento</h2>
            <p className="muted">Ultimi 14g vs 14g precedenti (calo traffico).</p>
            {trends.improving.length === 0 ? (
              <p className="muted empty-inline">Dati insufficienti.</p>
            ) : (
              <ul className="trend-list">
                {trends.improving.map((row) => (
                  <li key={row.key}>
                    <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>
                      {row.code} · {row.name}
                    </Link>
                    <span className="trend-delta trend-delta--down">
                      {row.pctChange.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="panel">
            <h2 style={{ fontSize: "1.25rem" }}>In peggioramento</h2>
            <p className="muted">Ultimi 14g vs 14g precedenti (aumento traffico).</p>
            {trends.worsening.length === 0 ? (
              <p className="muted empty-inline">Dati insufficienti.</p>
            ) : (
              <ul className="trend-list">
                {trends.worsening.map((row) => (
                  <li key={row.key}>
                    <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>
                      {row.code} · {row.name}
                    </Link>
                    <span className="trend-delta trend-delta--up">
                      +{row.pctChange.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.4rem" }}>Incroci più trafficati</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Incrocio</th>
                <th>Codice</th>
                <th>Passaggi (periodo)</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={row.key}>
                  <td>
                    <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>
                      {row.centralina?.name ?? `Device ${row.key}`}
                    </Link>
                  </td>
                  <td>{row.centralina?.code ?? "—"}</td>
                  <td>{formatNumber(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
