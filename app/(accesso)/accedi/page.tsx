import type { Metadata } from "next";
import Link from "next/link";
import MagicLinkForm from "@/components/MagicLinkForm";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="auth-card ds-dialog">
      <div>
        <h1>Accedi a Competia</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Ti mandiamo un link per entrare. Niente password da ricordare.
        </p>
      </div>
      <MagicLinkForm />
      <p className="small muted">
        Non hai ancora un account?{" "}
        <Link href="/richiedi-accesso" className="link">
          Richiedi accesso
        </Link>
      </p>
    </div>
  );
}
