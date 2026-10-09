import type { Metadata } from "next";
import { CtaBand, Feature, PageHero, SectionHead } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Chi siamo",
  description: "Perché esiste Competia e i principi con cui tratta fonti e segnali.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Chi siamo"
        title="Costruiamo Competia perché le decisioni sui prezzi meritano prove, non impressioni."
        lead="Nei team commerciali le informazioni sui competitor girano in chat, screenshot e fogli di calcolo. Competia le mette in un solo posto, con la fonte accanto."
      />

      <section className="section section--border">
        <div className="container">
          <SectionHead title="I nostri principi" />
          <div className="grid-3">
            <Feature icon="source" title="La fonte prima di tutto">
              Un dato senza pagina d&apos;origine non entra nel briefing. Vale per noi come per chi usa il prodotto.
            </Feature>
            <Feature icon="shield" title="Solo informazioni pubbliche">
              Lavoriamo su ciò che i competitor pubblicano: listini, cataloghi, offerte. Niente aree riservate.
            </Feature>
            <Feature icon="users" title="Le persone decidono">
              Competia ordina e collega. Cosa è vero e cosa conta lo decide il team, e resta scritto chi l&apos;ha deciso.
            </Feature>
          </div>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container split">
          <h2 className="reveal">A che punto siamo</h2>
          <div className="stack reveal">
            <p className="lead">
              Competia è in accesso su invito. Lavoriamo con pochi team alla volta per costruire il prodotto sui loro casi
              reali.
            </p>
            <p className="muted">
              Se il tuo team segue prezzi e promozioni dei competitor e vuoi provarlo, richiedi l&apos;accesso o scrivici.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
