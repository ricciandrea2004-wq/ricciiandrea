import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; errore?: string; uscito?: string; scaduta?: string }> }) {
  const { next, errore, uscito, scaduta } = await searchParams;
  return (
    <div className="auth-card ds-dialog">
      <div>
        <h1>Accedi a Competia</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Entra con la tua email di lavoro e la password. Se non ne hai ancora una, ti mandiamo un codice.
        </p>
      </div>
      {errore === "link" && (
        <p className="auth-notice" role="alert">
          Il link è scaduto o è già stato usato. Richiedine uno nuovo qui sotto.
        </p>
      )}
      {uscito && <p className="auth-notice">Sei uscito da Competia.</p>}
      {scaduta && (
        <p className="auth-notice" role="status">
          {scaduta === "inattiva"
            ? "Sei rimasto inattivo per più di 12 ore: per sicurezza rientra."
            : "La sessione dura al massimo 7 giorni: per sicurezza rientra."}
        </p>
      )}
      <LoginForm next={safeNext(next)} />
      <p className="small muted">
        Non hai ancora un account?{" "}
        <Link href="/richiedi-accesso" className="link">
          Richiedi accesso
        </Link>
      </p>
    </div>
  );
}
