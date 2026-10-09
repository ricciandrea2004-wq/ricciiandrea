import type { Metadata } from "next";
import Callout from "@/components/Callout";
import { CtaBand, Feature, PageHero, SectionHead } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Fonti",
  description: "Ogni dato in Competia è legato alla pagina pubblica da cui arriva, con la data in cui è stato osservato.",
};

export default function SourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Prodotto · Fonti"
        title="Se non c'è la fonte, non è un dato."
        lead="Competia lega ogni segnale alla pagina pubblica da cui arriva. Chi legge il briefing può aprirla e controllare da sé."
      />

      <section className="section section--border">
        <div className="container">
          <SectionHead title="Cosa si salva di una fonte" />
          <div className="grid-3">
            <Feature icon="link" title="L'indirizzo">
              Il link esatto della pagina: listino, catalogo, pagina offerte, PDF, post di annuncio.
            </Feature>
            <Feature icon="target" title="Competitor e categoria">
              A chi appartiene e che tipo di segnali produce, così le fonti si ritrovano per competitor.
            </Feature>
            <Feature icon="calendar" title="Le date">
              Quando è stata aggiunta e quando è stata osservata l&apos;ultima volta.
            </Feature>
          </div>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container split">
          <div className="reveal">
            <h2>Verificare vuol dire riaprire la fonte.</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              Prima di confermare un segnale, una persona del team riapre la pagina e controlla il prima e il dopo. Il nome
              di chi ha verificato e l&apos;ora restano nello storico del segnale.
            </p>
          </div>
          <div className="stack reveal">
            <Callout icon="shield">
              <strong>Solo pagine pubbliche.</strong> Competia lavora su informazioni che chiunque può consultare: niente
              aree riservate dei competitor, niente dati personali.
            </Callout>
            <Callout icon="clock">
              <strong>Le pagine cambiano.</strong> La data di osservazione dice quando il dato era vero, anche se la pagina
              nel frattempo è stata aggiornata.
            </Callout>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
