import type { Metadata } from "next";
import { SparkBars } from "@/components/SparkBars";
import { formatDateIt, formatNumber, getCitySeries, getTopDevices, loadBundle } from "@/lib/data";

export const metadata: Metadata = {
  title: "Andamento",
};

export default async function AndamentoPage() {
  const bundle = await loadBundle();
  const city = getCitySeries(bundle);
  const top = getTopDevices(bundle, 10);

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
        </div>

        <div className="panel" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.4rem" }}>Serie giornaliera</h2>
          <p className="muted">
            {city.length} giorni · sync {formatDateIt(bundle.syncedAt.slice(0, 10))}
          </p>
          <SparkBars series={city} maxBars={45} />
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.4rem" }}>Incroci più trafficati</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Incrocio</th>
                <th>Codice</th>
                <th>Passaggi (mese)</th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => (
                <tr key={row.deviceId}>
                  <td>{row.centralina?.name ?? `Device ${row.deviceId}`}</td>
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
