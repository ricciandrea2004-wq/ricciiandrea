import type { Metadata } from "next";
import { TrafficMap } from "@/components/TrafficMap";
import { formatDateIt, loadBundle } from "@/lib/data";
import { toMapPayload } from "@/lib/map-data";

export const metadata: Metadata = {
  title: "Mappa traffico",
};

export default async function MappaPage() {
  const bundle = await loadBundle();
  const payload = toMapPayload(bundle.centraline, bundle.flows);

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="section__eyebrow">Mobilità</p>
          <h1>Mappa delle centraline</h1>
          <p className="section__lead">
            {bundle.summary.centralineCount} impianti con spire inductive. Dati flussi:{" "}
            {bundle.summary.flowDays} giorni nel mese sincronizzato (
            {formatDateIt(bundle.syncedAt.slice(0, 10))}).
          </p>
        </div>
        <TrafficMap payload={payload} />
      </div>
    </section>
  );
}
