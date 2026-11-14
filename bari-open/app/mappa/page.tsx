import type { Metadata } from "next";
import { TrafficMap } from "@/components/TrafficMap";
import { formatDateIt, loadBundle } from "@/lib/data";
import { toMapPayload, type MapDistricts } from "@/lib/map-data";

export const metadata: Metadata = {
  title: "Mappa traffico",
};

type PageProps = {
  searchParams: Promise<{ c?: string }>;
};

export default async function MappaPage({ searchParams }: PageProps) {
  const params = await searchParams;
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
  const syncedTime = new Date(bundle.syncedAt).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="section__eyebrow">Mobilità</p>
          <h1>Mappa delle centraline</h1>
          <p className="section__lead">
            {bundle.summary.centralineCount} impianti con spire inductive. Dati flussi:{" "}
            {bundle.summary.flowDays} giorni nel mese sincronizzato.
          </p>
          <p className="muted" style={{ marginTop: "-0.35rem" }}>
            Aggiornato {syncedLabel} alle {syncedTime}
          </p>
        </div>
        <TrafficMap
          payload={payload}
          initialSelectedKey={params.c ?? null}
          initialShowAccidents={false}
        />
      </div>
    </section>
  );
}
