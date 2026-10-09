import Link from "next/link";
import { LogoMark, Wordmark } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header>
        <Link href="/" className="logo">
          <LogoMark />
          <Wordmark />
        </Link>
      </header>
      <main className="auth-main">{children}</main>
      <footer className="auth-foot">
        <Link href="/legale/privacy">Privacy</Link> · <Link href="/legale/termini">Termini</Link>
      </footer>
    </div>
  );
}
