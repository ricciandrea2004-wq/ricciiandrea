"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LiveBusBadge } from "./LiveBusBadge";

const LINKS: Array<{ href: string; key: "nav_map" | "nav_trend" | "nav_safety" | "nav_briefing" | "nav_live" | "nav_sources" | "nav_pitch" | "nav_status" }> = [
  { href: "/mappa", key: "nav_map" },
  { href: "/andamento", key: "nav_trend" },
  { href: "/sicurezza", key: "nav_safety" },
  { href: "/briefing", key: "nav_briefing" },
  { href: "/ora", key: "nav_live" },
  { href: "/stato", key: "nav_status" },
  { href: "/fonti", key: "nav_sources" },
  { href: "/per-il-comune", key: "nav_pitch" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="brand-row">
          <Link href="/" className="brand" aria-label="Vista Bari home">
            Vista <span>Bari</span>
          </Link>
          <LiveBusBadge />
        </div>
        <nav className="nav" aria-label="Principale">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            type="button"
            className="chip lang-chip"
            aria-label={lang === "it" ? "Switch to English" : "Passa all’italiano"}
            onClick={() => setLang(lang === "it" ? "en" : "it")}
          >
            {t("lang_toggle")}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function PrintButton({ label = "Stampa briefing" }: { label?: string }) {
  return (
    <button
      type="button"
      className="btn btn--primary no-print"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
