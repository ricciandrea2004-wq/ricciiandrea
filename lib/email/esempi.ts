// Sample data for the previews (scripts/email/render-previews.ts), taken from the workspace demo.
import { competitors, organization, signals } from "../demo-data";
import type { EmailData, SegnaleEmail } from "./templates";

const name = (id: string) => competitors.find((c) => c.id === id)?.name ?? id;

const asEmail = (s: (typeof signals)[number]): SegnaleEmail => ({
  id: s.id,
  competitor: name(s.competitorId),
  categoria: s.category,
  titolo: s.title,
  prima: s.before,
  dopo: s.after,
  stato: s.status,
  osservatoIl: s.observedAt,
});

const week = signals.filter((s) => s.status !== "discarded").map(asEmail);

export const esempi: { [K in keyof EmailData]: EmailData[K] } = {
  "richiesta-ricevuta": {},
  "accesso-approvato": {
    url: "https://www.competia.work/invito/esempio-token",
    organizzazione: organization.name,
  },
  "link-accesso": {
    url: "https://www.competia.work/auth/confirm?token_hash=esempio&type=magiclink",
    codice: "482913",
  },
  benvenuto: { nome: "Giulia", organizzazione: organization.name },
  "riepilogo-settimanale": {
    nome: "Giulia",
    organizzazione: organization.name,
    da: "2026-10-01T00:00:00Z",
    a: "2026-10-07T20:00:00Z",
    conteggi: {
      nuovi: week.length,
      verificati: week.filter((s) => s.stato === "verified" || s.stato === "in_briefing").length,
      daVerificare: week.filter((s) => s.stato === "to_verify").length,
    },
    segnali: [...week].sort((a, b) => (a.stato === "to_verify" ? -1 : 0) - (b.stato === "to_verify" ? -1 : 0)),
  },
  "segnali-da-verificare": {
    nome: "Giulia",
    organizzazione: organization.name,
    sogliaGiorni: 3,
    segnali: week.filter((s) => s.stato === "to_verify").slice(0, 2),
  },
  "sito-non-risponde": {
    controllatoIl: "2026-10-09T06:00:12Z",
    controllati: 7,
    problemi: [
      { url: "https://www.competia.work/prodotto", stato: 500, ms: 412 },
      { url: "https://www.competia.work/accedi", stato: null, errore: "oltre 10 s", ms: 10_003 },
    ],
  },
};
