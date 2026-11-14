import type { Metadata } from "next";
import { SicurezzaClient } from "@/components/SicurezzaClient";
import { formatDateIt, formatNumber, loadBundle } from "@/lib/data";
import { toMapPayload, type MapDistricts } from "@/lib/map-data";
import { safetyScores } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Sicurezza stradale",
};

export default async function SicurezzaPage() {
  const bundle = await loadBundle();
  const districts =
    "districts" in bundle
      ? ((bundle as { districts?: MapDistricts }).districts)
      : undefined;
  const scores = safetyScores(bundle);
  const safetyByKey = Object.fromEntries(scores.map((s) => [s.key, s.score]));
  const payload = toMapPayload(
    bundle.centraline,
    bundle.flows,
    bundle.accidents,
    districts,
    safetyByKey,
  );
  const syncedLabel = formatDateIt(bundle.syncedAt.slice(0, 10));
  const worst = scores.slice(0, 5);

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="section__eyebrow">Incidenti 2025</p>
          <h1>Sicurezza stradale</h1>
          <p className="section__lead">
            {formatNumber(bundle.summary.accidentCount)} eventi geolocalizzati, di cui{" "}
            {formatNumber(bundle.summary.injuryAccidents)} con lesioni. Sovrapposti alla rete
            delle centraline per leggere traffico e rischio insieme.
          </p>
          <p className="muted" style={{ marginTop: "-0.35rem" }}>
            Aggiornato {syncedLabel}
          </p>
        </div>

        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.25rem" }}>Safety score per centralina</h2>
          <p className="muted">
            Punteggio 0–100 (più alto = più sicuro) da lesioni entro 180 m rispetto al traffico
            locale. Peggiori 5:
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Incrocio</th>
                <th>Score</th>
                <th>Lesioni vicine</th>
              </tr>
            </thead>
            <tbody>
              {worst.map((row) => (
                <tr key={row.key}>
                  <td>
                    {row.code} · {row.name}
                  </td>
                  <td>{row.score}</td>
                  <td>{row.injuryNearby}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SicurezzaClient payload={payload} />
      </div>
    </section>
  );
}
