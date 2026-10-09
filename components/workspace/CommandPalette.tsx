"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "../Icon";

export type PaletteEntry = { group: string; label: string; href: string; icon: IconName; hint?: string };

export default function CommandPalette({ entries, onClose }: { entries: PaletteEntry[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? entries.filter((e) => `${e.label} ${e.hint ?? ""} ${e.group}`.toLowerCase().includes(q)) : entries;
    return list.slice(0, 30);
  }, [entries, query]);

  useEffect(() => setActive(0), [query]);

  function go(entry: PaletteEntry | undefined) {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  let lastGroup = "";

  return (
    <div className="palette-backdrop ds-dialog-backdrop" onMouseDown={onClose}>
      <div
        className="palette ds-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Cerca nel workspace"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="palette__input"
          placeholder="Cerca segnali, fonti, competitor, pagine…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `pal-${active}` : undefined}
        />
        {results.length === 0 ? (
          <p className="palette__empty">Nessun risultato per “{query}”.</p>
        ) : (
          <ul className="palette__list" id="palette-list" role="listbox">
            {results.map((r, i) => {
              const header = r.group !== lastGroup ? r.group : null;
              lastGroup = r.group;
              return (
                <li key={r.href + i} role="presentation">
                  {header && <div className="palette__group">{header}</div>}
                  <div
                    id={`pal-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="palette__item"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                  >
                    <Icon name={r.icon} />
                    <span style={{ flex: 1, minWidth: 0 }}>{r.label}</span>
                    {r.hint && <span className="xs muted">{r.hint}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
