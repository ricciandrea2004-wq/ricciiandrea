"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import CommandPalette, { type PaletteEntry } from "./CommandPalette";
import { workspaceLinks } from "@/lib/nav";

type ShellApi = {
  openMobile: () => void;
  toggleCollapsed: () => void;
  collapsed: boolean;
  openPalette: () => void;
  toast: (message: string) => void;
};

const ShellContext = createContext<ShellApi | null>(null);

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside WorkspaceShell");
  return ctx;
}

const COLLAPSE_KEY = "competia-sidebar-collapsed";

export default function WorkspaceShell({
  orgName,
  toVerify,
  entries,
  children,
}: {
  orgName: string;
  toVerify: number;
  entries: PaletteEntry[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Storage blocked: keep the sidebar open.
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }, []);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        toggleCollapsed();
      } else if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  const api: ShellApi = {
    openMobile: () => setMobileOpen(true),
    toggleCollapsed,
    collapsed,
    openPalette: () => setPaletteOpen(true),
    toast,
  };

  return (
    <ShellContext.Provider value={api}>
      <div className="ws" data-collapsed={collapsed} data-mobile-open={mobileOpen}>
        <aside className="ws-sidebar" aria-label="Workspace" inert={collapsed && !mobileOpen ? true : undefined}>
          <div className="ws-sidebar__inner">
            <div className="row" style={{ justifyContent: "space-between", gap: 4 }}>
              <span className="ws-org">
                <span className="ws-org__badge" aria-hidden="true">
                  {orgName.charAt(0)}
                </span>
                {orgName}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => (mobileOpen ? setMobileOpen(false) : toggleCollapsed())}
                aria-label="Chiudi la barra laterale"
                title="Chiudi la barra laterale (⌘\)"
              >
                <Icon name="chevronsLeft" />
              </button>
            </div>

            <nav className="ws-nav" aria-label="Sezioni" style={{ marginTop: 8 }}>
              <button type="button" className="ws-nav__item" onClick={() => setPaletteOpen(true)}>
                <Icon name="search" />
                Cerca
                <span className="ws-nav__kbd">⌘K</span>
              </button>
              <Link href="/app" className="ws-nav__item" aria-current={isActive("/app") ? "page" : undefined}>
                <Icon name="home" />
                Panoramica
              </Link>
              <span className="ws-nav__sep" />
              {workspaceLinks.map((l) => (
                <Link key={l.href} href={l.href} className="ws-nav__item" aria-current={isActive(l.href) ? "page" : undefined}>
                  <Icon name={l.icon} />
                  {l.label}
                  {l.href === "/app/segnali" && toVerify > 0 && (
                    <span className="ws-nav__count" title={`${toVerify} da verificare`}>
                      {toVerify}
                    </span>
                  )}
                </Link>
              ))}
              <span className="ws-nav__sep" />
              <Link
                href="/app/impostazioni/profilo"
                className="ws-nav__item"
                aria-current={isActive("/app/impostazioni") ? "page" : undefined}
              >
                <Icon name="settings" />
                Impostazioni
              </Link>
              <Link href="/analytics" className="ws-nav__item" prefetch={false}>
                <Icon name="chart" />
                Analytics del sito
              </Link>
            </nav>

            <div className="ws-sidebar__foot ws-nav">
              <Link href="/prodotto" className="ws-nav__item">
                <Icon name="help" />
                Aiuto
              </Link>
              <Link href="/" className="ws-nav__item">
                <Icon name="arrowLeft" />
                Torna al sito
              </Link>
            </div>
          </div>
        </aside>
        {mobileOpen && <div className="ws-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

        <div className="ws-main">{children}</div>
      </div>

      {paletteOpen && <CommandPalette entries={entries} onClose={() => setPaletteOpen(false)} />}

      <div className="toast-region" role="status" aria-live="polite">
        {toastMsg && (
          <div className="toast-msg ds-toast" key={toastMsg}>
            {toastMsg}
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}
