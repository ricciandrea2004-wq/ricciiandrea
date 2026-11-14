import type { Metadata } from "next";
import Link from "next/link";
import { formatDateIt, formatNumber, loadBundle } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";
import { StatoLiveProbes } from "@/components/StatoLiveProbes";

export const metadata: Metadata = {
  title: "Stato sistema",
};

export default async function StatoPage() {
  const bundle = await loadBundle();
  const freshness = freshnessLabel(bundle.syncedAt);
  const synced = formatDateIt(bundle.syncedAt.slice(0, 10));
  const syncedTime = new Date(bundle.syncedAt).toLocaleTimeString("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "48rem" }}>
        <div className="page-hero">
          <p className="section__eyebrow">Operatività</p>
          <h1>Stato Vista Bari</h1>
          <p className="section__lead">
            Età del sync open data e salute dei feed live (AMTAB, ARPA, Open-Meteo).
          </p>
        </div>

        <div className={`panel${freshness.stale ? " panel--warn" : ""}`} style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem" }}>Sync dataset</h2>
          <p>
            Ultimo sync: <strong>{synced}</strong> alle {syncedTime} Europe/Rome
          </p>
          <p className="muted">{freshness.messageIt}</p>
          <ul className="muted">
            <li>{formatNumber(bundle.summary.centralineCount)} centraline</li>
            <li>
              {formatNumber(bundle.summary.flowDays)} giorni / {bundle.summary.flowMonths} mesi flussi
            </li>
            <li>{formatNumber(bundle.summary.accidentCount)} incidenti</li>
            <li>{bundle.sources.length} fonti CKAN</li>
          </ul>
          <Link className="btn btn--ghost-dark" href="/api/stato">
            JSON /api/stato
          </Link>
        </div>

        <StatoLiveProbes />
      </div>
    </section>
  );
}
