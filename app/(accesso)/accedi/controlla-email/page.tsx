import type { Metadata } from "next";
import Link from "next/link";
import LottieAnimation from "@/components/motion/LottieAnimation";

export const metadata: Metadata = { title: "Controlla l'email", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <div className="auth-card ds-dialog" style={{ textAlign: "center" }}>
      <LottieAnimation name="email" width={48} height={48} className="lottie--center" />
      <div>
        <h1 style={{ marginInline: "auto" }}>Controlla l&apos;email</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Abbiamo mandato un link di accesso {email ? <strong>a {email}</strong> : "al tuo indirizzo"}. Il link vale 1 ora e si
          usa una volta sola.
        </p>
      </div>
      <p className="small muted">
        Non è arrivato? Controlla la posta indesiderata oppure{" "}
        <Link href="/accedi" className="link">
          richiedi un nuovo link
        </Link>
        .
      </p>
    </div>
  );
}
