import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
import { footerGroups } from "@/lib/nav";
import AnimatedLogo from "@/components/motion/AnimatedLogo";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo">
              <AnimatedLogo trigger="view" />
            </Link>
            <p className="muted" style={{ marginTop: 12, maxWidth: 300 }}>
              Segnali competitivi su prezzi, assortimento e promozioni, sempre con la fonte.
            </p>
          </div>
          {footerGroups.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h2>{g.title}</h2>
              <ul>
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 competia.work</span>
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
