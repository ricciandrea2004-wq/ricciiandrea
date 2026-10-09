import type { Metadata } from "next";
import AccessForm from "@/components/AccessForm";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Richiedi accesso",
  description: "Competia è in accesso su invito. Lascia l'email di lavoro e ti scriviamo appena c'è posto.",
};

const next = [
  "Ricevi subito un'email di conferma.",
  "Ti scriviamo quando si apre un posto nel programma pilota.",
  "Configuriamo insieme i primi competitor e le prime fonti.",
];

export default function RequestAccessPage() {
  return (
    <section className="page-hero">
      <div className="container split">
        <div className="ds-stagger">
          <p className="eyebrow" style={{ "--i": 0 } as React.CSSProperties}>
            Accesso su invito
          </p>
          <h1 className="display" style={{ "--i": 1, marginTop: 12 } as React.CSSProperties}>
            Richiedi accesso a Competia.
          </h1>
          <p className="lead" style={{ "--i": 2, marginTop: 20 } as React.CSSProperties}>
            Lavoriamo con pochi team alla volta. Usa l&apos;email di lavoro: ci aiuta a capire chi siete.
          </p>
          <div style={{ "--i": 3 } as React.CSSProperties}>
            <AccessForm redirectTo="/richiedi-accesso/grazie" />
            <p className="xs muted">
              Usiamo l&apos;email solo per risponderti. Dettagli nell&apos;<a href="/legale/privacy">informativa privacy</a>.
            </p>
          </div>
        </div>
        <div className="card ds-pop">
          <h2 style={{ fontSize: "var(--text-h4)" }}>Cosa succede dopo</h2>
          <ul className="checklist" style={{ marginTop: 16 }}>
            {next.map((n) => (
              <li key={n}>
                <Icon name="checkCircle" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
