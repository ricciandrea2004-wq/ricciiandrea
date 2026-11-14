import type { Metadata } from "next";
import { formatDateIt, loadBundle } from "@/lib/data";

export const metadata: Metadata = {
  title: "Fonti e licenze",
};

export default async function FontiPage() {
  const bundle = await loadBundle();

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "46rem" }}>
        <div className="page-hero">
          <p className="section__eyebrow">Trasparenza</p>
          <h1>Fonti e licenze</h1>
          <p className="section__lead">
            Vista Bari non inventa i numeri: li legge dai dataset aperti del Comune di Bari.
            Ultimo sync: {formatDateIt(bundle.syncedAt.slice(0, 10))} (
            {new Date(bundle.syncedAt).toLocaleTimeString("it-IT", {
              timeZone: "Europe/Rome",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            Europe/Rome).
          </p>
        </div>

        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.35rem" }}>Dataset usati oggi (CKAN)</h2>
          <p className="muted">
            I flussi CKAN del portale comunale sono aggiornati tipicamente <strong>una volta al
            giorno</strong>, non in tempo reale. Non sono feed live.
          </p>
          <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
            {bundle.sources.map((s) => (
              <li key={s.id} style={{ marginBottom: "0.85rem" }}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
                <div className="muted">
                  ID CKAN: {s.id}
                  {s.resourceName ? ` · risorsa ${s.resourceName}` : ""} · licenza {s.license}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel" style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.35rem" }}>Fonti live / near-live da integrare</h2>
          <p className="muted">
            Layer previsti per le prossime iterazioni di Vista Bari — ancora non collegati al
            cruscotto.
          </p>
          <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
            <li style={{ marginBottom: "0.85rem" }}>
              <strong>AMTAB GTFS-RT</strong> — posizioni veicoli e aggiornamenti corse in near-real
              time (
              <a href="https://avl.amtab.it/WSExportGTFS_RT" target="_blank" rel="noreferrer">
                avl.amtab.it/WSExportGTFS_RT
              </a>
              ): feed <em>VehiclePosition</em> e <em>TripUpdates</em>.
            </li>
            <li style={{ marginBottom: "0.85rem" }}>
              <strong>ARPA Puglia Qualità dell’aria</strong> — stazioni e misure ambientali (
              <a
                href="https://cloud.arpa.puglia.it/QualitaAria"
                target="_blank"
                rel="noreferrer"
              >
                cloud.arpa.puglia.it/QualitaAria
              </a>
              ).
            </li>
            <li style={{ marginBottom: 0 }}>
              <strong>Open-Meteo</strong> — meteo orario/giornaliero per contestualizzare traffico e
              incidenti (API pubblica, senza telecamere).
            </li>
          </ul>
        </div>

        <div className="panel">
          <h2 style={{ fontSize: "1.35rem" }}>Privacy e telecamere</h2>
          <p>
            Non accediamo a sistemi di videosorveglianza, streaming video o dati personali. Le
            “centraline” usate sono impianti semaforici con <strong>spire inductive</strong> che
            pubblicano conteggi aggregati di veicoli. Nessuna telecamera entra nel perimetro di
            Vista Bari.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Portale:{" "}
            <a href="https://opendata.comune.bari.it" target="_blank" rel="noreferrer">
              opendata.comune.bari.it
            </a>
            . Attribuzione: Comune di Bari.
          </p>
        </div>
      </div>
    </section>
  );
}
