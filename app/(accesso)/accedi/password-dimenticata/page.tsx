import type { Metadata } from "next";
import Link from "next/link";
import { ResetRequestForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Password dimenticata", robots: { index: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <div className="auth-card ds-dialog">
      <div>
        <h1>Password dimenticata</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Scrivi l&apos;email con cui entri: ti mandiamo un link per sceglierne una nuova.
        </p>
      </div>
      {errore === "link" && (
        <p className="auth-notice" role="alert">
          Il link è scaduto o è già stato usato. Richiedine uno nuovo qui sotto.
        </p>
      )}
      <ResetRequestForm />
      <p className="small muted">
        Ti ricordi la password?{" "}
        <Link href="/accedi" className="link">
          Torna all&apos;accesso
        </Link>
      </p>
    </div>
  );
}
