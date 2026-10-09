import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHero } from "@/components/Marketing";

export const metadata: Metadata = {
  title: "Contatti",
  description: "Scrivi al team di Competia per una demo, una domanda o una collaborazione.",
};

// TODO(Andrea): confermare l'indirizzo email pubblico.
const CONTACT_EMAIL = "ciao@competia.work";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contatti"
        title="Parliamone."
        lead="Per una demo, una domanda sul prodotto o una collaborazione, scrivici. Rispondiamo di persona, di solito entro un giorno lavorativo."
      />
      <section className="section section--border">
        <div className="container grid-2">
          <div className="card reveal">
            <span className="feature__icon">
              <Icon name="mail" />
            </span>
            <h2 style={{ fontSize: "var(--text-h4)", marginTop: 12 }}>Email</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Raccontaci in due righe chi siete e cosa seguite dei competitor.
            </p>
            <p style={{ marginTop: 16, fontWeight: 500, userSelect: "all" }}>{CONTACT_EMAIL}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-secondary" style={{ marginTop: 16 }}>
              Scrivi un&apos;email
            </a>
          </div>
          <div className="card reveal">
            <span className="feature__icon">
              <Icon name="calendar" />
            </span>
            <h2 style={{ fontSize: "var(--text-h4)", marginTop: 12 }}>Demo</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Lascia l&apos;email di lavoro: ti scriviamo per fissare mezz&apos;ora e mostrarti il workspace sui tuoi
              competitor.
            </p>
            <Link href="/richiedi-accesso" className="btn btn-primary" style={{ marginTop: 16 }}>
              Richiedi accesso
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
