"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/mappa", label: "Mappa" },
  { href: "/andamento", label: "Andamento" },
  { href: "/sicurezza", label: "Sicurezza" },
  { href: "/fonti", label: "Fonti" },
  { href: "/per-il-comune", label: "Per il Comune" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label="Vista Bari home">
          Vista <span>Bari</span>
        </Link>
        <nav className="nav" aria-label="Principale">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
