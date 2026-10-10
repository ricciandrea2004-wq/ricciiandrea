import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Accedi", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; errore?: string; uscito?: string }> }) {
  const { next, errore, uscito } = await searchParams;
  return (
    <div className="auth-card ds-dialog">
      <div>
        <h1>Accedi a Competia</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          Ti mandiamo un link per entrare. Se hai impostato una password, puoi usare quella.
        </p>
      </div>
      {errore === "link" && (
        <p className="auth-notice" role="alert">
          Il link è scaduto o è già stato usato. Richiedine uno nuovo qui sotto.
        </p>
      )}
      {uscito && <p className="auth-notice">Sei uscito da Competia.</p>}
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
