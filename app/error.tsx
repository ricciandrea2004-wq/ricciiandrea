"use client";

import Link from "next/link";
import { useEffect } from "react";
import LottieAnimation from "@/components/motion/LottieAnimation";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="error-page">
      <div className="ds-stagger" style={{ maxWidth: 520 }}>
        <LottieAnimation name="avviso" width={48} height={48} className="lottie--center" />
        <p className="code">Errore{error.digest ? ` · ${error.digest}` : ""}</p>
        <h1 style={{ "--i": 1 } as React.CSSProperties}>Qualcosa non ha funzionato.</h1>
        <p className="lead" style={{ "--i": 2, marginInline: "auto" } as React.CSSProperties}>
          Non dipende da te. Riprova; se succede ancora, scrivici dalla pagina contatti.
        </p>
        <div className="row" style={{ "--i": 3 } as React.CSSProperties}>
          <button type="button" className="btn btn-primary btn-lg" onClick={reset}>
            Riprova
          </button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Vai alla home
          </Link>
        </div>
      </div>
    </main>
  );
}
