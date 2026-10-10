import type { Metadata } from "next";
import Link from "next/link";
import { CodeForm } from "@/components/auth/AuthForms";
import LottieAnimation from "@/components/motion/LottieAnimation";

export const metadata: Metadata = { title: "Controlla l'email", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; tipo?: string; next?: string }> }) {
  const { email, tipo, next } = await searchParams;
  const recovery = tipo === "recupero";
  return (
    <div className="auth-card ds-dialog" style={{ textAlign: "center" }}>
      <LottieAnimation name="email" width={48} height={48} className="lottie--center" />
      <div>
        <h1 style={{ marginInline: "auto" }}>Controlla l&apos;email</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Se c&apos;è un account per{" "}
          {email ? <strong>{email}</strong> : "questo indirizzo"},{" "}
          {recovery ? "ti abbiamo mandato il link per scegliere una nuova password." : "ti abbiamo mandato un link di accesso."} Il link vale 1
          ora e si usa una volta sola.
        </p>
      </div>
      {email && <CodeForm email={email} recovery={recovery} next={next} />}
      <p className="small muted">
        Non è arrivato? Controlla la posta indesiderata oppure{" "}
        <Link href={recovery ? "/accedi/password-dimenticata" : "/accedi"} className="link">
          richiedi un nuovo link
        </Link>
        .
      </p>
    </div>
  );
}
