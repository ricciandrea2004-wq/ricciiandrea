"use client";

import { useMemo, useState } from "react";
import { CategoryTag } from "../SignalTags";
import { useShell } from "./WorkspaceShell";
import { formatShortDate, type Competitor, type Signal, type Source } from "@/lib/domain";

// Picks verified signals and shows the draft live. Saving needs the database, so it is not active yet.
export default function BriefingComposer({ signals, competitors, sources }: { signals: Signal[]; competitors: Competitor[]; sources: Source[] }) {
  const { toast } = useShell();
  const eligible = signals.filter((s) => s.status === "verified" || s.status === "in_briefing");
  const [title, setTitle] = useState("Briefing commerciale · settimana 41");
  const [competitor, setCompetitor] = useState("tutti");
  const [selected, setSelected] = useState<string[]>(() => eligible.filter((s) => s.status === "verified").map((s) => s.id));

  const visible = eligible.filter((s) => competitor === "tutti" || s.competitorId === competitor);
  const picked = useMemo(() => eligible.filter((s) => selected.includes(s.id)), [eligible, selected]);
  const nameOf = (id: string) => competitors.find((c) => c.id === id)?.name ?? "";
  const sourceOf = (id: string) => sources.find((s) => s.id === id);

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="grid-2" style={{ alignItems: "start", gap: 32 }}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="field">
          <label className="label" htmlFor="b-title">
            Titolo
          </label>
          <input id="b-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="b-competitor">
            Competitor
          </label>
          <select id="b-competitor" className="select" value={competitor} onChange={(e) => setCompetitor(e.target.value)}>
            <option value="tutti">Tutti</option>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="label" style={{ marginBottom: 8 }}>
            Segnali verificati
          </legend>
          {visible.length === 0 ? (
            <div className="empty">
              <strong>Nessun segnale verificato</strong>Verifica prima qualche segnale per questo competitor.
            </div>
          ) : (
            <ul className="select-list">
              {visible.map((s) => (
                <li key={s.id}>
                  <label className="select-item">
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
                    <span>
                      <span style={{ fontWeight: 500, display: "block" }}>{s.title}</span>
                      <span className="row xs muted" style={{ gap: 6, marginTop: 4 }}>
                        <CategoryTag category={s.category} /> {nameOf(s.competitorId)} · {formatShortDate(s.observedAt)}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={picked.length === 0}
            onClick={() => toast("Il salvataggio si attiva quando colleghiamo il database. La bozza non è stata salvata.")}
          >
            Crea la bozza
          </button>
          <span className="small muted num">{picked.length} segnali scelti</span>
        </div>
      </div>

      <article className="card" aria-label="Anteprima della bozza" style={{ position: "sticky", top: 64 }}>
        <p className="xs muted">Anteprima</p>
        <h2 style={{ fontSize: "var(--text-h4)", marginTop: 6 }}>{title || "Senza titolo"}</h2>
        {picked.length === 0 ? (
          <p className="small muted" style={{ marginTop: 12 }}>
            Scegli almeno un segnale per vedere la bozza.
          </p>
        ) : (
          <>
            <ul className="small" style={{ paddingLeft: "1.2em", marginTop: 12, display: "grid", gap: 8 }}>
              {picked.map((s, i) => (
                <li key={s.id}>
                  <strong style={{ fontWeight: 500 }}>{nameOf(s.competitorId)}:</strong> {s.title.charAt(0).toLowerCase() + s.title.slice(1)}
                  <span className="footnote-ref">{i + 1}</span>
                </li>
              ))}
            </ul>
            <div className="footnotes" style={{ marginTop: 16 }}>
              <span className="xs">Fonti</span>
              <ol>
                {picked.map((s) => (
                  <li key={s.id}>
                    {sourceOf(s.sourceId)?.label}, {nameOf(s.competitorId)}, osservata il {formatShortDate(s.observedAt)}.
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
