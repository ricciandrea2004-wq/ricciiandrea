"use client";

import { useActionState } from "react";
import Icon from "../Icon";
import { categories, categoryLabel, type Competitor } from "@/lib/domain";
import { addCompetitor, addSource, checkSourceNow, inviteMember, type FormState } from "@/lib/workspace/actions";

function Status({ state }: { state: FormState }) {
  return (
    <p className="form-status" role="status" aria-live="polite" data-state={state.error ? "error" : state.done ? "done" : undefined}>
      {state.error ?? state.done}
    </p>
  );
}

function FieldError({ state, name }: { state: FormState; name: string }) {
  const msg = state.fields?.[name];
  return msg ? (
    <span className="hint" style={{ color: "var(--tag-red)" }}>
      {msg}
    </span>
  ) : null;
}

export function CompetitorForm() {
  const [state, action, pending] = useActionState(addCompetitor, {});
  return (
    <form action={action} className="stack" style={{ gap: 24 }}>
      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="c-name">
            Nome
          </label>
          <input id="c-name" name="name" defaultValue={state.values?.name} className="input" required maxLength={120} placeholder="Es. Nordica Forniture" aria-invalid={!!state.fields?.name} />
          <FieldError state={state} name="name" />
        </div>
        <div className="field">
          <label className="label" htmlFor="c-sector">
            Settore
          </label>
          <input id="c-sector" name="sector" defaultValue={state.values?.sector} className="input" maxLength={80} placeholder="Es. Forniture per ufficio" />
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="c-website">
            Sito
          </label>
          <input id="c-website" name="website" defaultValue={state.values?.website} className="input" type="url" inputMode="url" placeholder="https://" aria-invalid={!!state.fields?.website} />
          <FieldError state={state} name="website" />
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="c-note">
            Nota
          </label>
          <textarea id="c-note" name="note" defaultValue={state.values?.note} className="textarea" maxLength={1000} placeholder="Perché lo seguiamo, cosa guardare." />
        </div>
      </div>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Salvataggio…" : "Aggiungi competitor"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function SourceForm({ competitors, competitorId }: { competitors: Competitor[]; competitorId?: string }) {
  const [state, action, pending] = useActionState(addSource, {});
  return (
    <form action={action} className="stack" style={{ gap: 24 }}>
      <div className="form-grid">
        <div className="field span-2">
          <label className="label" htmlFor="s-url">
            Indirizzo della pagina
          </label>
          <input id="s-url" name="url" defaultValue={state.values?.url} className="input" type="url" inputMode="url" required placeholder="https://" aria-invalid={!!state.fields?.url} aria-describedby="s-url-hint" />
          <span className="hint" id="s-url-hint">
            Una pagina pubblica: listino, promozioni, catalogo, notizie. Leggiamo solo quello che il sito permette in robots.txt.
          </span>
          <FieldError state={state} name="url" />
        </div>
        <div className="field">
          <label className="label" htmlFor="s-competitor">
            Competitor
          </label>
          <select id="s-competitor" name="competitorId" className="select" defaultValue={state.values?.competitorId ?? competitorId ?? competitors[0]?.id} required>
            {competitors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError state={state} name="competitorId" />
        </div>
        <div className="field">
          <label className="label" htmlFor="s-category">
            Cosa guardare
          </label>
          <select id="s-category" name="category" className="select" defaultValue={state.values?.category ?? "price"}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="s-label">
            Nome della fonte
          </label>
          <input id="s-label" name="label" defaultValue={state.values?.label} className="input" maxLength={120} placeholder="Es. Pagina prezzi" />
        </div>
        <div className="field">
          <label className="label" htmlFor="s-selector">
            Parte della pagina (facoltativa)
          </label>
          <input id="s-selector" name="selector" defaultValue={state.values?.selector} className="input" maxLength={200} placeholder="Es. #prezzi" aria-describedby="s-selector-hint" />
          <span className="hint" id="s-selector-hint">
            Un selettore CSS, per ignorare menu e banner che cambiano spesso.
          </span>
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="s-note">
            Nota
          </label>
          <textarea id="s-note" name="note" defaultValue={state.values?.note} className="textarea" maxLength={1000} placeholder="Cosa c'è su questa pagina, cosa conta." />
        </div>
      </div>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={pending || competitors.length === 0}>
          {pending ? "Salvataggio e prima lettura…" : "Aggiungi e leggi la pagina"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function CheckNowButton({ sourceId }: { sourceId: string }) {
  const [state, action, pending] = useActionState(checkSourceNow, {});
  return (
    <form action={action} className="stack" style={{ gap: 8 }}>
      <input type="hidden" name="sourceId" value={sourceId} />
      <div>
        <button type="submit" className="btn btn-secondary" disabled={pending}>
          <Icon name="clock" />
          {pending ? "Controllo in corso…" : "Controlla ora"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, {});
  return (
    <form action={action} className="stack" style={{ gap: 16 }}>
      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="m-email">
            Email
          </label>
          <input id="m-email" name="email" defaultValue={state.values?.email} className="input" type="email" required placeholder="nome@azienda.it" aria-invalid={!!state.fields?.email} />
        </div>
      </div>
      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Invio…" : "Invia invito"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}
