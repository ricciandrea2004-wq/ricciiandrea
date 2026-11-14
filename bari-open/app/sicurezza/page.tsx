import type { Metadata } from "next";
import { SicurezzaClient } from "@/components/SicurezzaClient";
import { formatNumber, loadBundle } from "@/lib/data";
import { toMapPayload } from "@/lib/map-data";

export const metadata: Metadata = {
  title: "Sicurezza stradale",
};

export default async function SicurezzaPage() {
  const bundle = await loadBundle();
  const payload = toMapPayload(bundle.centraline, bundle.flows, bundle.accidents);

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
        </div>
        <SicurezzaClient payload={payload} />
      </div>
    </section>
  );
}
