import type { Metadata } from "next";
import { SicurezzaClient } from "@/components/SicurezzaClient";
import { formatDateIt, formatNumber, loadBundle } from "@/lib/data";
import { toMapPayload, type MapDistricts } from "@/lib/map-data";

export const metadata: Metadata = {
  title: "Sicurezza stradale",
};

export default async function SicurezzaPage() {
  const bundle = await loadBundle();
  const districts =
    "districts" in bundle
      ? ((bundle as { districts?: MapDistricts }).districts)
      : undefined;
  const payload = toMapPayload(
    bundle.centraline,
    bundle.flows,
    bundle.accidents,
    districts,
  );
  const syncedLabel = formatDateIt(bundle.syncedAt.slice(0, 10));

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
        <SicurezzaClient payload={payload} />
      </div>
    </section>
  );
}
