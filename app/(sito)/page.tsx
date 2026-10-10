import Link from "next/link";
import AccessForm from "@/components/AccessForm";
import Icon from "@/components/Icon";
import { Feature, SectionHead } from "@/components/Marketing";
import SignalExample, { heroSamples } from "@/components/SignalExample";
import LottieAnimation, { type LottieName } from "@/components/motion/LottieAnimation";
import { categoryColor } from "@/lib/domain";

const problems = [
  { icon: "layers" as const, title: "Dispersi", text: "Le variazioni di prezzo e le promozioni stanno in decine di pagine diverse, ogni giorno." },
  { icon: "source" as const, title: "Senza prova", text: "Uno screenshot senza data e senza link non regge in una riunione commerciale." },
  { icon: "clock" as const, title: "In ritardo", text: "Quando il briefing arriva, la promozione è già finita e la risposta è già in ritardo." },
];

const steps: { title: string; text: string; art: LottieName }[] = [
  { art: "fonte", title: "Annota la fonte", text: "Aggiungi la pagina da cui arriva il dato, con competitor e categoria. Il link resta sempre attaccato al segnale." },
  { art: "verifica", title: "Verifica il segnale", text: "Confronta il prima e il dopo e decidi se è un cambiamento reale o un rumore da scartare." },
  { art: "briefing", title: "Componi il briefing", text: "Scegli i segnali verificati e ottieni un documento in cui ogni affermazione porta alla sua fonte." },
];

const kinds = [
  { icon: "tag" as const, color: categoryColor.price, title: "Prezzo", text: "Variazioni di listino, piani e condizioni d'acquisto." },
  { icon: "layers" as const, color: categoryColor.assortment, title: "Assortimento", text: "Prodotti aggiunti, tolti o con nuove varianti." },
  { icon: "calendar" as const, color: categoryColor.promotion, title: "Promozione", text: "Sconti, offerte e campagne con date di inizio e fine." },
];

// Facts about how the product works, not usage numbers.
const facts = [
  { num: "3", label: <><strong>categorie di segnale:</strong> prezzo, assortimento, promozioni.</> },
  { num: "4", label: <><strong>stati, una sola regola:</strong> nel briefing entra solo ciò che è verificato.</> },
  { num: "1", label: <><strong>fonte dietro ogni segnale,</strong> sempre a un clic da chi legge.</> },
];

const audience = [
  "Team commerciale che prepara trattative e risposte ai competitor",
  "Pricing e category management",
  "Product marketing che deve capire cosa cambia sul mercato",
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="ds-stagger">
            <p className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
              Intelligence commerciale B2B
            </p>
            <h1 className="display" style={{ "--i": 1, marginTop: 16 } as React.CSSProperties}>
              Sai cosa cambia sul mercato, <span className="hl">con la fonte in mano.</span>
            </h1>
            <p className="lead" style={{ "--i": 2, marginTop: 24 } as React.CSSProperties}>
              <strong>Competia raccoglie i segnali su prezzi, assortimento e promozioni dei tuoi competitor</strong> e li
              collega alla pagina da cui arrivano. Ogni segnale si verifica prima di entrare nel briefing.
            </p>
            <div className="hero__actions" style={{ "--i": 3 } as React.CSSProperties}>
              <Link href="/richiedi-accesso" className="btn btn-primary btn-lg">
                Richiedi accesso
              </Link>
              <Link href="/prodotto" className="btn btn-secondary btn-lg">
                Vedi come funziona
              </Link>
            </div>
            <p className="hero__note" style={{ "--i": 4 } as React.CSSProperties}>
              Accesso su invito, pochi team alla volta.
            </p>
          </div>
          <SignalExample className="ds-pop" samples={heroSamples} />
        </div>
      </section>

      <section className="facts" aria-label="Come funziona, in tre numeri">
        <div className="container">
          <ul className="facts__grid">
            {facts.map((f) => (
              <li key={f.num}>
                <span className="facts__num">{f.num}</span>
                <span className="facts__label">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section ink">
        <div className="container">
          <SectionHead title="Le informazioni ci sono. Mancano il tempo e la prova." />
          <div className="grid-3">
            {problems.map((p) => (
              <Feature key={p.title} icon={p.icon} title={p.title}>
                {p.text}
              </Feature>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="reveal">
            <h2>Dal dato grezzo al briefing, in tre passi.</h2>
            <p className="lead" style={{ marginTop: 12 }}>
              Il lavoro resta tuo: Competia tiene in ordine le fonti e ti fa decidere cosa è vero.
            </p>
            <p style={{ marginTop: 20 }}>
              <Link href="/prodotto" className="link">
                Scopri il prodotto
              </Link>
            </p>
          </div>
          <ol className="steps steps--art reveal">
            {steps.map((s, i) => (
              <li key={s.title}>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
                <LottieAnimation name={s.art} width={112} height={78} delay={i * 180} className="steps__art" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--border">
        <div className="container">
          <SectionHead title="Tre tipi di segnale, tutti con una fonte." />
          <div className="grid-3">
            {kinds.map((k) => (
              <Feature key={k.title} icon={k.icon} color={k.color} title={k.title}>
                {k.text}
              </Feature>
            ))}
          </div>
          <p style={{ marginTop: 32 }}>
            <Link href="/prodotto/segnali" className="link">
              Come funzionano i segnali
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container split">
          <h2 className="reveal">Pensato per chi decide su prezzi e posizionamento.</h2>
          <ul className="checklist checklist--lg reveal">
            {audience.map((a) => (
              <li key={a}>
                <Icon name="checkCircle" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="accesso" aria-labelledby="accesso-titolo">
        <div className="container">
          <div className="cta-band ink reveal">
            <h2 id="accesso-titolo">Porta il prossimo briefing su segnali verificati.</h2>
            <p className="lead" style={{ marginTop: 16 }}>
              Siamo in accesso su invito. Lascia l&apos;email di lavoro e ti scriviamo appena c&apos;è posto.
            </p>
            <AccessForm />
          </div>
          <p className="xs muted" style={{ marginTop: 16 }}>
            L&apos;esempio nella pagina è illustrativo e non descrive dati reali.
          </p>
        </div>
      </section>
    </>
  );
}
