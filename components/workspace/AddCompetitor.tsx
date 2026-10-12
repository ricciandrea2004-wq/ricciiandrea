"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Icon from "../Icon";

// Adding a competitor starts from its link: the user pastes the site address and the name is
// proposed from the domain (editable). Field names match the save action, so it can be passed
// as `action`; without one the panel says plainly that the data are only examples.

export type AddCompetitorState = { error?: string; fields?: Record<string, string>; done?: string; values?: Record<string, string> };

type Action = (state: AddCompetitorState, form: FormData) => Promise<AddCompetitorState>;

export const ADD_COMPETITOR_ID = "aggiungi";

// "nordica.it" → "https://nordica.it"; anything that still isn't a web address returns null.
function normalizeUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

// "www.nordica-forniture.it" → "Nordica Forniture"
function nameFromUrl(url: URL): string {
  const host = url.hostname.replace(/^www\d?\./, "");
  const label = host.split(".")[0] ?? host;
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const demoAction: Action = async (_, form) => {
  const url = normalizeUrl(String(form.get("website") ?? ""));
  const values = { website: String(form.get("website") ?? ""), name: String(form.get("name") ?? "") };
  if (!url) return { error: "Incolla l'indirizzo del sito, per esempio https://www.concorrente.it.", fields: { website: "Indirizzo non valido." }, values };
  const name = values.name.trim() || nameFromUrl(url);
  return {
    done: `Dati di esempio: ${name} non viene salvato finché il workspace non è collegato al database.`,
    values,
  };
};

const steps = [
  { title: "Incolla il link", text: "L'indirizzo del sito del concorrente. Il nome lo proponiamo noi." },
  { title: "Scegli le pagine", text: "Listino, promozioni, catalogo: ogni pagina diventa una fonte." },
  { title: "Verifica i segnali", text: "Le leggiamo ogni mattina e ti mostriamo cosa è cambiato." },
];

export default function AddCompetitor({ action, compact = false }: { action?: Action; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(action ?? demoAction, {});
  const [website, setWebsite] = useState(state.values?.website ?? "");
  const [name, setName] = useState(state.values?.name ?? "");
  const nameTouched = useRef(false);
  const urlRef = useRef<HTMLInputElement>(null);

  // Header and sidebar buttons point to #aggiungi: put the cursor in the link field.
  useEffect(() => {
    const focusIfTarget = () => {
      if (window.location.hash === `#${ADD_COMPETITOR_ID}`) urlRef.current?.focus({ preventScroll: false });
    };
    focusIfTarget();
    window.addEventListener("hashchange", focusIfTarget);
    return () => window.removeEventListener("hashchange", focusIfTarget);
  }, []);

  const onWebsite = (value: string) => {
    setWebsite(value);
    if (nameTouched.current) return;
    const url = normalizeUrl(value);
    setName(url ? nameFromUrl(url) : "");
  };

  const onBlur = () => {
    const url = normalizeUrl(website);
    if (url && !/^https?:\/\//i.test(website.trim())) setWebsite(url.toString());
  };

  const fieldError = (key: string) => state.fields?.[key];

  return (
    <section id={ADD_COMPETITOR_ID} className="add-panel ink" data-compact={compact || undefined} aria-labelledby="add-panel-title">
      <div className="add-panel__body">
        <p className="eyebrow add-panel__eyebrow">Nuovo concorrente</p>
        <h2 id="add-panel-title" className="add-panel__title">
          Incolla il link del sito, <span className="hl">al resto pensiamo noi.</span>
        </h2>

        <form action={formAction} className="add-panel__form" noValidate>
          <div className="field add-panel__url">
            <label className="visually-hidden" htmlFor="add-website">
              Link del sito del concorrente
            </label>
            <span className="add-panel__input-icon" aria-hidden="true">
              <Icon name="link" />
            </span>
            <input
              ref={urlRef}
              id="add-website"
              name="website"
              className="input input-lg"
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="https://www.concorrente.it"
              value={website}
              onChange={(e) => onWebsite(e.target.value)}
              onBlur={onBlur}
              required
              aria-invalid={!!fieldError("website")}
            />
          </div>
          <div className="field add-panel__name">
            <label className="visually-hidden" htmlFor="add-name">
              Nome del concorrente
            </label>
            <input
              id="add-name"
              name="name"
              className="input input-lg"
              placeholder="Nome"
              maxLength={120}
              value={name}
              onChange={(e) => {
                nameTouched.current = e.target.value !== "";
                setName(e.target.value);
              }}
              aria-invalid={!!fieldError("name")}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
            <Icon name="plus" />
            {pending ? "Aggiungo…" : "Aggiungi"}
          </button>
        </form>

        <p
          className="form-status add-panel__status"
          role="status"
          aria-live="polite"
          data-state={state.error ? "error" : state.done ? "done" : undefined}
        >
          {state.error ?? state.done ?? "Il nome lo ricaviamo dal link: puoi cambiarlo prima di aggiungere."}
        </p>
      </div>

      {!compact && (
        <ol className="steps add-panel__steps">
          {steps.map((s) => (
            <li key={s.title}>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
