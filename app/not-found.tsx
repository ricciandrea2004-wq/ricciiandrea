import Link from "next/link";
import LottieAnimation from "@/components/motion/LottieAnimation";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="ds-stagger" style={{ maxWidth: 520 }}>
        <LottieAnimation name="bussola" width={48} height={48} className="lottie--center" />
        <p className="code">404</p>
        <h1 style={{ "--i": 1 } as React.CSSProperties}>Questa pagina non esiste.</h1>
        <p className="lead" style={{ "--i": 2, marginInline: "auto" } as React.CSSProperties}>
          Il link potrebbe essere vecchio o scritto male.
        </p>
        <div className="row" style={{ "--i": 3 } as React.CSSProperties}>
          <Link href="/" className="btn btn-primary btn-lg">
            Vai alla home
          </Link>
          <Link href="/app" className="btn btn-secondary btn-lg">
            Apri il workspace
          </Link>
        </div>
      </div>
    </main>
  );
}
