"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function KeyboardHelp() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="help-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onClick={() => setOpen(false)}
    >
      <div className="help-modal__card" onClick={(e) => e.stopPropagation()}>
        <h2 id="help-title">{t("help_title")}</h2>
        <ul className="help-modal__list">
          <li>
            <kbd>/</kbd> {t("search_focus")}
          </li>
          <li>
            <kbd>?</kbd> {t("help_open")}
          </li>
          <li>
            <kbd>Esc</kbd> Chiudi pannelli
          </li>
        </ul>
        <button type="button" className="btn btn--ghost-dark" onClick={() => setOpen(false)}>
          Chiudi
        </button>
      </div>
    </div>
  );
}
