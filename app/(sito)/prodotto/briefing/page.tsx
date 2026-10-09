import type { Metadata } from "next";
import { CtaBand, Feature, PageHero, SectionHead } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Briefing",
  description: "Il briefing di Competia: un documento con i segnali verificati del periodo, dove ogni affermazione porta alla fonte.",
};

export default function BriefingProductPage() {
  return (
    <>
      <PageHero
        eyebrow="Prodotto · Briefing"
        title="Un briefing che regge le domande."
        lead="Scegli il periodo e i segnali verificati. Competia prepara la bozza; tu la rifinisci e la condividi. Ogni frase ha la sua nota alla fonte."
      />

      <section className="section section--border">
        <div className="container split">
          <div className="reveal">
            <h2>Com&apos;è fatto</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              Un&apos;introduzione di poche righe, i segnali raggruppati per competitor e, in fondo, l&apos;elenco delle fonti
              numerate.
            </p>
          </div>
          <article className="card reveal" aria-label="Esempio di briefing">
            <p className="xs muted">Esempio illustrativo</p>
            <h3 style={{ fontSize: "var(--text-h4)", marginTop: 8 }}>Briefing commerciale · settimana 40</h3>
            <p className="small muted" style={{ marginTop: 4 }}>
              28 settembre – 3 ottobre 2026
            </p>
            <p style={{ marginTop: 16 }}>
              Il competitor A abbassa il piano Pro da 52 a 48 euro al mese<span className="footnote-ref">1</span>, mentre il
              competitor B alza del 3,5% il listino delle scrivanie<span className="footnote-ref">2</span>.
            </p>
            <div className="footnotes" style={{ marginTop: 20 }}>
              <span className="xs">Fonti</span>
              <ol>
                <li>Pagina prezzi pubblica del competitor A, osservata il 2 ottobre 2026.</li>
                <li>Listino rivenditori del competitor B, osservato il 1 ottobre 2026.</li>
              </ol>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container">
          <SectionHead title="Dalla bozza alla riunione" />
          <div className="grid-3">
            <Feature icon="checkCircle" title="Solo segnali verificati">
              Quelli ancora da verificare non si possono aggiungere: il briefing non contiene ipotesi.
            </Feature>
            <Feature icon="doc" title="Si modifica come un documento">
              Testo a blocchi, segnali incorporati, note automatiche. Lo rifinisci prima di inviarlo.
            </Feature>
            <Feature icon="share" title="Si condivide">
              Esporti il PDF per la riunione. Il link di sola lettura per chi non ha l&apos;account arriverà più avanti.
            </Feature>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
