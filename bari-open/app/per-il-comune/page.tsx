import type { Metadata } from "next";
import Link from "next/link";
import { formatNumber, loadBundle } from "@/lib/data";

export const metadata: Metadata = {
  title: "Per il Comune",
};

export default async function PerIlComunePage() {
  const bundle = await loadBundle();

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "46rem" }}>
        <div className="page-hero">
          <p className="section__eyebrow">Offerta</p>
          <h1>Per il Comune di Bari</h1>
          <p className="section__lead">
            Un prototipo già funzionante sui vostri open data: pronto da mostrare in assessorato
            e da evolvere insieme.
          </p>
        </div>

        <div className="panel pitch">
          <h2 style={{ fontSize: "1.4rem" }}>Cosa consegnamo oggi</h2>
          <ol>
            <li>
              Mappa interattiva di {formatNumber(bundle.summary.centralineCount)} centraline con
              dettaglio flussi per spira.
            </li>
            <li>
              Andamento cittadino e ranking degli incroci più trafficati sul mese sincronizzato.
            </li>
            <li>
              Overlay sicurezza: {formatNumber(bundle.summary.accidentCount)} incidenti 2025 con
              filtri (lesioni, meteo).
            </li>
            <li>Pagina fonti con licenze e nota privacy (niente telecamere).</li>
          </ol>

          <h2 style={{ fontSize: "1.4rem" }}>Perché è utile</h2>
          <p className="muted">
            Trasforma dataset già pubblicati in uno strumento di lettura per mobilità e sicurezza
            stradale, senza nuovi sensori e senza trattare dati personali.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>Possibili passi successivi</h2>
          <ol>
            <li>Alert settimanali agli uffici su picchi anomali di traffico.</li>
            <li>Integrazione TPL AMTAB (GTFS) e segnalazioni URP Digitale.</li>
            <li>Report automatici per circoscrizione / municipio.</li>
          </ol>

          <div className="cta-row">
            <Link className="btn btn--primary" href="/mappa">
              Prova la mappa
            </Link>
            <Link className="btn btn--ghost-dark" href="/fonti">
              Vedi le fonti
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
