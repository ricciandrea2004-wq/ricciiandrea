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
            e da evolvere insieme. Il dominio{" "}
            <strong>competia.work</strong> ospiterà Vista Bari in produzione.
          </p>
        </div>

        <div className="panel pitch">
          <h2 style={{ fontSize: "1.4rem" }}>Prova di valore: briefing live</h2>
          <p className="muted">
            Il{" "}
            <Link href="/briefing">briefing settimanale mobilità</Link> è già online: cinque
            finding, anomalie di traffico e hotspot sicurezza stampabili per gli uffici — senza
            nuovi sensori e senza telecamere.
          </p>

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
            <li>
              Briefing settimanale stampabile con finding e tabelle operative.
            </li>
            <li>Pagina fonti con licenze e nota privacy (niente telecamere).</li>
          </ol>

          <h2 style={{ fontSize: "1.4rem" }}>Perché è utile</h2>
          <p className="muted">
            Trasforma dataset già pubblicati in uno strumento di lettura per mobilità e sicurezza
            stradale, senza nuovi sensori e senza trattare dati personali.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>Prossimi layer live</h2>
          <ol>
            <li>AMTAB GTFS-RT (VehiclePosition, TripUpdates) per il trasporto pubblico.</li>
            <li>ARPA Puglia Qualità dell’aria accanto ai flussi di traffico.</li>
            <li>Open-Meteo per correlare meteo, picchi e incidenti.</li>
            <li>Alert automatici agli uffici e report per circoscrizione / municipio.</li>
          </ol>

          <div className="cta-row">
            <Link className="btn btn--primary" href="/briefing">
              Apri il briefing
            </Link>
            <Link className="btn btn--ghost-dark" href="/mappa">
              Prova la mappa
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
