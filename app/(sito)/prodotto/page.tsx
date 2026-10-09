import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { CtaBand, PageHero, SectionHead } from "@/components/Marketing";
import { productLinks } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Prodotto",
  description: "Come Competia porta un dato dalla pagina del competitor al briefing, passando per la verifica.",
};

const flow = [
  {
    title: "Fonte",
    text: "Ogni osservazione parte da una pagina pubblica: listino, catalogo, pagina offerte, annuncio. La salvi una volta, con competitor e categoria.",
  },
  {
    title: "Segnale",
    text: "Quando qualcosa cambia registri il prima e il dopo, la data e cosa ne pensi. Il segnale resta \"da verificare\" finché qualcuno non lo conferma.",
  },
  {
    title: "Briefing",
    text: "Scegli i segnali verificati del periodo. Il briefing li raccoglie in un documento dove ogni frase porta alla sua fonte.",
  },
];

export default function ProductPage() {
  const sub = productLinks.slice(1);
  return (
    <>
      <PageHero
        eyebrow="Prodotto"
        title="Un posto solo per tutto quello che cambia sul mercato."
        lead="Competia è uno spazio di lavoro per il team commerciale: raccogli le fonti, verifichi i segnali, prepari il briefing. Ogni passaggio lascia una traccia."
      />

      <section className="section section--border">
        <div className="container">
          <SectionHead title="Fonte, segnale, briefing." lead="Tre oggetti, collegati fra loro. Nessun dato entra nel briefing senza la sua pagina d'origine." />
          <ol className="steps reveal" style={{ maxWidth: 760 }}>
            {flow.map((f) => (
              <li key={f.title}>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--subtle">
        <div className="container">
          <SectionHead title="Approfondisci" />
          <div className="grid-3">
            {sub.map((l) => (
              <Link key={l.href} href={l.href} className="card reveal">
                <span className="feature__icon">{l.icon && <Icon name={l.icon} />}</span>
                <h3 style={{ fontSize: "var(--text-h4)", marginTop: 12 }}>{l.label}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {l.description}
                </p>
                <span className="row small" style={{ marginTop: 16, color: "var(--accent-text)" }}>
                  Leggi <Icon name="arrowRight" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
