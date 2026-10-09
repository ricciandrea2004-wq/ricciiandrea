"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { headerLinks, productLinks } from "@/lib/nav";
import AnimatedLogo from "@/components/motion/AnimatedLogo";

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const inProduct = pathname.startsWith("/prodotto");

  return (
    <header className="site-header" data-scrolled={scrolled || mobileOpen}>
      <div className="container site-header__inner">
        <Link href="/" className="logo" aria-label="competia.work, home">
          <AnimatedLogo trigger="load" />
        </Link>

        <nav className="site-nav" aria-label="Principale">
          <div className="nav-dropdown" ref={dropdownRef}>
            <button
              type="button"
              className="site-nav__link"
              aria-expanded={menuOpen}
              aria-controls="menu-prodotto"
              aria-current={inProduct ? "page" : undefined}
              onClick={() => setMenuOpen((o) => !o)}
            >
              Prodotto
              <Icon name="chevronDown" />
            </button>
            {menuOpen && (
              <div className="menu ds-pop" id="menu-prodotto">
                {productLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="menu__item">
                    {l.icon && <Icon name={l.icon} />}
                    <div>
                      <strong>{l.label}</strong>
                      <span>{l.description}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {headerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="site-nav__link"
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link href="/accedi" className="btn btn-ghost hide-mobile">
            Accedi
          </Link>
          <Link href="/richiedi-accesso" className="btn btn-primary hide-mobile">
            Richiedi accesso
          </Link>
          <button
            type="button"
            className="icon-btn nav-toggle"
            aria-expanded={mobileOpen}
            aria-controls="mobile-panel"
            aria-label={mobileOpen ? "Chiudi il menu" : "Apri il menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Icon name={mobileOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div className="mobile-panel" id="mobile-panel" data-open={mobileOpen}>
        <div className="container ds-page">
          <p className="eyebrow">Prodotto</p>
          {productLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <p className="eyebrow">Azienda</p>
          {headerLinks.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href="/accedi">Accedi</Link>
          <Link href="/richiedi-accesso" className="btn btn-primary btn-lg">
            Richiedi accesso
          </Link>
        </div>
      </div>
    </header>
  );
}
