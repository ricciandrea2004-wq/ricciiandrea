import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header>
        <Link href="/" className="logo">
          <img src="/favicon.svg" alt="" width={22} height={22} />
          <span>Competia<span>.Work</span></span>
        </Link>
      </header>
      <main className="auth-main">{children}</main>
      <footer className="auth-foot">
        <Link href="/legale/privacy">Privacy</Link> · <Link href="/legale/termini">Termini</Link>
      </footer>
    </div>
  );
}
