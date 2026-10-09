import type { Metadata } from "next";
import { CtaBand, Feature, PageHero, SectionHead, SignalExample } from "@/components/Marketing";
import { StatusTag } from "@/components/SignalTags";
import { statuses, statusLabel } from "@/lib/domain";

export const metadata: Metadata = {
  title: "Segnali",
  description: "Prezzo, assortimento e promozioni: come Competia registra un cambiamento con il prima, il dopo e la fonte.",
};

const statusText: Record<(typeof statuses)[number], string> = {
  to_verify: "Il segnale è stato registrato ma nessuno l'ha ancora confermato.",
  verified: "Una persona del team ha controllato la fonte e conferma il cambiamento.",
  in_briefing: "Il segnale è stato usato in almeno un briefing.",
  discarded: "Era un test, un errore o un rumore. Resta in archivio con il motivo.",
};

export default function SignalsPage() {
  return (
    <>
      <PageHero
        eyebrow="Prodotto · Segnali"
        title="Un segnale è un cambiamento con il prima, il dopo e la prova."
        lead="Non una notizia generica: un fatto preciso su un competitor, osservato in una data e in una pagina che chiunque nel team può riaprire."
      />

      <section className="section section--border">
        <div className="container">
          <SectionHead title="Tre categorie" lead="Le categorie hanno sempre lo stesso colore, nel workspace e nei briefing." />
          <div className="grid-3">
            <Feature icon="tag" title="Prezzo">
              Listini, piani in abbonamento, soglie di spedizione, condizioni di pagamento. Si registra il valore prima e
              dopo.
            </Feature>
            <Feature icon="layers" title="Assortimento">
              Prodotti nuovi, tolti o con varianti diverse. Si registra cosa c&apos;era e cosa c&apos;è adesso.
            </Feature>
            <Feature icon="calendar" title="Promozione">
              Sconti, bundle, campagne. Si registrano anche la data di inizio e quella di fine, se la pagina le indica.
            </Feature>
          </div>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container split">
          <div className="reveal">
            <h2>Com&apos;è fatto un segnale</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              Competitor, categoria, prima e dopo, fonte, data di osservazione e una riga di interpretazione: perché
              conta per noi.
            </p>
          </div>
          <SignalExample
            className="reveal"
            kind="Promozione · Competitor B"
            title="Spedizione gratuita sopra i 300 euro"
            before="500 €"
            after="300 €"
            source="pagina offerte del competitor"
            observed="7 ottobre 2026"
            status={{ label: "Da verificare", color: "yellow" }}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead title="Quattro stati, una sola regola" lead="Nel briefing entrano solo i segnali verificati." />
          <ul className="list reveal" style={{ maxWidth: 760 }}>
            {statuses.map((s) => (
              <li key={s}>
                <div className="list__item">
                  <span style={{ width: 120, flex: "none" }}>
                    <StatusTag status={s} />
                  </span>
                  <span className="list__main">{statusText[s]}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="visually-hidden">Stati: {statuses.map((s) => statusLabel[s]).join(", ")}.</p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
