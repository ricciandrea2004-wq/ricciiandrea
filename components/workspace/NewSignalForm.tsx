"use client";

import { useState, type FormEvent } from "react";
import { useShell } from "./WorkspaceShell";
import { categories, categoryLabel, type Competitor, type Source } from "@/lib/domain";

export default function NewSignalForm({ competitors, sources }: { competitors: Competitor[]; sources: Source[] }) {
  const { toast } = useShell();
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id ?? "");
  const [sourceMode, setSourceMode] = useState<"existing" | "new">("existing");
  const ownSources = sources.filter((s) => s.competitorId === competitorId);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast("Il salvataggio si attiva quando colleghiamo il database. Il segnale non è stato salvato.");
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 24 }}>
      <div className="form-grid">
        <div className="field span-2">
          <label className="label" htmlFor="title">
            Titolo
          </label>
          <input id="title" name="title" className="input" required placeholder="Es. Il piano Pro scende da 52 a 48 euro al mese" />
          <span className="hint">Una frase che dice cosa è cambiato, con i numeri se ci sono.</span>
        </div>

        <div className="field">
          <label className="label" htmlFor="competitor">
            Competitor
          </label>
          <select id="competitor" name="competitor" className="select" value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="field">
          <legend className="label" style={{ marginBottom: 6 }}>
            Categoria
          </legend>
          <div className="row">
            {categories.map((c, i) => (
              <label key={c} className="row small" style={{ gap: 6, marginRight: 12 }}>
                <input type="radio" name="category" value={c} defaultChecked={i === 0} style={{ accentColor: "var(--accent)" }} />
                {categoryLabel[c]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="label" htmlFor="before">
            Prima
          </label>
          <input id="before" name="before" className="input" required placeholder="52 € / mese" />
        </div>
        <div className="field">
          <label className="label" htmlFor="after">
            Dopo
          </label>
          <input id="after" name="after" className="input" required placeholder="48 € / mese" />
        </div>

        <div className="field">
          <label className="label" htmlFor="observed">
            Osservato il
          </label>
          <input id="observed" name="observed" type="date" className="input" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>

        <fieldset className="field">
          <legend className="label" style={{ marginBottom: 6 }}>
            Fonte
          </legend>
          <div className="row">
            <label className="row small" style={{ gap: 6, marginRight: 12 }}>
              <input type="radio" name="sourceMode" checked={sourceMode === "existing"} onChange={() => setSourceMode("existing")} style={{ accentColor: "var(--accent)" }} />
              Già salvata
            </label>
            <label className="row small" style={{ gap: 6 }}>
              <input type="radio" name="sourceMode" checked={sourceMode === "new"} onChange={() => setSourceMode("new")} style={{ accentColor: "var(--accent)" }} />
              Nuova
            </label>
          </div>
        </fieldset>

        {sourceMode === "existing" ? (
          <div className="field span-2">
            <label className="label" htmlFor="source">
              Fonte salvata
            </label>
            <select id="source" name="source" className="select" required>
              {ownSources.length === 0 && <option value="">Nessuna fonte per questo competitor</option>}
              {ownSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="field">
              <label className="label" htmlFor="sourceLabel">
                Nome della fonte
              </label>
              <input id="sourceLabel" name="sourceLabel" className="input" required placeholder="Pagina prezzi pubblica" />
            </div>
            <div className="field">
              <label className="label" htmlFor="sourceUrl">
                Indirizzo
              </label>
              <input id="sourceUrl" name="sourceUrl" type="url" className="input" required placeholder="https://" />
            </div>
          </>
        )}

        <div className="field span-2">
          <label className="label" htmlFor="interpretation">
            Interpretazione
          </label>
          <textarea id="interpretation" name="interpretation" className="textarea" placeholder="Perché conta per noi?" />
        </div>
      </div>

      <div className="row">
        <button type="submit" className="btn btn-primary btn-lg">
          Salva come da verificare
        </button>
        <a href="/app/segnali" className="btn btn-ghost btn-lg">
          Annulla
        </a>
      </div>
    </form>
  );
}
