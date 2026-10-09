"use client";

import Link from "next/link";
import Icon from "../Icon";
import { useShell } from "./WorkspaceShell";

export type Crumb = { label: string; href?: string };

export default function Topbar({ crumbs, children }: { crumbs: Crumb[]; children?: React.ReactNode }) {
  const { openMobile, collapsed, toggleCollapsed, openPalette } = useShell();
  return (
    <div className="ws-topbar">
      <button type="button" className="icon-btn only-mobile" onClick={openMobile} aria-label="Apri il menu">
        <Icon name="menu" />
      </button>
      {collapsed && (
        <button type="button" className="icon-btn" onClick={toggleCollapsed} aria-label="Apri la barra laterale" title="Apri la barra laterale (⌘\)">
          <Icon name="menu" />
        </button>
      )}
      <nav className="crumbs" aria-label="Percorso">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span className="crumbs__sep">/</span>}
              {c.href && !last ? (
                <Link href={c.href}>{c.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>{c.label}</span>
              )}
            </span>
          );
        })}
      </nav>
      <div className="ws-topbar__actions">
        {children}
        <button type="button" className="icon-btn only-mobile" onClick={openPalette} aria-label="Cerca">
          <Icon name="search" />
        </button>
      </div>
    </div>
  );
}
