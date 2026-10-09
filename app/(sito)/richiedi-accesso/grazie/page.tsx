import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Richiesta ricevuta",
  robots: { index: false },
};

export default function ThanksPage() {
  return (
    <section className="error-page">
      <div className="ds-stagger" style={{ maxWidth: 520 }}>
        <Icon name="checkCircle" className="page-head__icon" />
        <h1 style={{ "--i": 1, marginTop: 8 } as React.CSSProperties}>Richiesta ricevuta.</h1>
        <p className="lead" style={{ "--i": 2, marginInline: "auto" } as React.CSSProperties}>
          Ti abbiamo scritto un&apos;email di conferma. Se non la trovi, controlla nella posta indesiderata.
        </p>
        <div className="row" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/prodotto" className="btn btn-secondary btn-lg">
            Scopri il prodotto
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg">
            Torna alla home
          </Link>
        </div>
      </div>
    </section>
  );
}
