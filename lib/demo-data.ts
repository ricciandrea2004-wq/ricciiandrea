// Demo data for the workspace until Supabase is wired in. Every name and figure here is invented.
import type { Briefing, Competitor, Member, Signal, Source } from "./domain";

export const organization = { name: "Acme Distribuzione", slug: "acme" };

export const competitors: Competitor[] = [
  {
    id: "nordica",
    name: "Nordica Forniture",
    sector: "Forniture per ufficio",
    website: "https://nordica.example",
    note: "Concorrente principale nel Nord Italia. Aggiorna il listino a inizio mese.",
  },
  {
    id: "vela",
    name: "Vela Software",
    sector: "Software gestionale",
    website: "https://vela.example",
    note: "Piani in abbonamento, promozioni frequenti a fine trimestre.",
  },
  {
    id: "brio",
    name: "Brio Retail",
    sector: "E-commerce B2B",
    website: "https://brio.example",
    note: "Catalogo ampio, cambia spesso l'assortimento.",
  },
];

export const sources: Source[] = [
  {
    id: "src-vela-prezzi",
    competitorId: "vela",
    label: "Pagina prezzi pubblica",
    category: "price",
    url: "https://vela.example/prezzi",
    addedAt: "2026-09-12T09:00:00Z",
    lastObservedAt: "2026-10-02T08:30:00Z",
    note: "Mostra i tre piani mensili. I prezzi sono IVA esclusa.",
  },
  {
    id: "src-vela-blog",
    competitorId: "vela",
    label: "Blog: annunci di prodotto",
    category: "promotion",
    url: "https://vela.example/blog",
    addedAt: "2026-09-12T09:05:00Z",
    lastObservedAt: "2026-10-06T10:00:00Z",
    note: "Le promozioni a tempo vengono annunciate qui prima che in newsletter.",
  },
  {
    id: "src-nordica-catalogo",
    competitorId: "nordica",
    label: "Catalogo sedute",
    category: "assortment",
    url: "https://nordica.example/catalogo/sedute",
    addedAt: "2026-09-15T14:20:00Z",
    lastObservedAt: "2026-10-05T07:45:00Z",
    note: "Elenco completo con codici articolo.",
  },
  {
    id: "src-nordica-listino",
    competitorId: "nordica",
    label: "Listino rivenditori (PDF)",
    category: "price",
    url: "https://nordica.example/listino-2026.pdf",
    addedAt: "2026-09-15T14:30:00Z",
    lastObservedAt: "2026-10-01T09:00:00Z",
    note: "Listino in PDF, aggiornato il primo del mese.",
  },
  {
    id: "src-brio-offerte",
    competitorId: "brio",
    label: "Pagina offerte",
    category: "promotion",
    url: "https://brio.example/offerte",
    addedAt: "2026-09-20T11:00:00Z",
    lastObservedAt: "2026-10-07T16:10:00Z",
    note: "Offerte con data di fine indicata in pagina.",
  },
  {
    id: "src-brio-novita",
    competitorId: "brio",
    label: "Novità in catalogo",
    category: "assortment",
    url: "https://brio.example/novita",
    addedAt: "2026-09-20T11:10:00Z",
    lastObservedAt: "2026-10-08T08:00:00Z",
    note: "",
  },
];

export const signals: Signal[] = [
  {
    id: "s-101",
    competitorId: "vela",
    category: "price",
    title: "Il piano Pro scende da 52 a 48 euro al mese",
    before: "52 € / mese",
    after: "48 € / mese",
    sourceId: "src-vela-prezzi",
    observedAt: "2026-10-02T08:30:00Z",
    interpretation: "Riduzione del 7,7% sul piano più venduto, probabilmente per rispondere al nostro listino di settembre.",
    status: "in_briefing",
    history: [
      { status: "to_verify", at: "2026-10-02T08:30:00Z", by: "Giulia R." },
      { status: "verified", at: "2026-10-02T11:00:00Z", by: "Marco T." },
      { status: "in_briefing", at: "2026-10-03T09:15:00Z", by: "Marco T." },
    ],
  },
  {
    id: "s-102",
    competitorId: "vela",
    category: "promotion",
    title: "Sconto del 20% sui piani annuali fino al 31 ottobre",
    before: "Nessuna promozione",
    after: "−20% sui piani annuali",
    sourceId: "src-vela-blog",
    observedAt: "2026-10-06T10:00:00Z",
    interpretation: "Promozione di fine trimestre, come a giugno. Durata 25 giorni.",
    status: "verified",
    history: [
      { status: "to_verify", at: "2026-10-06T10:00:00Z", by: "Giulia R." },
      { status: "verified", at: "2026-10-06T15:40:00Z", by: "Giulia R." },
    ],
  },
  {
    id: "s-103",
    competitorId: "nordica",
    category: "assortment",
    title: "Tre nuove sedute ergonomiche nella linea Studio",
    before: "12 modelli",
    after: "15 modelli",
    sourceId: "src-nordica-catalogo",
    observedAt: "2026-10-05T07:45:00Z",
    interpretation: "Entrano nella fascia media dove oggi abbiamo solo due modelli.",
    status: "to_verify",
    history: [{ status: "to_verify", at: "2026-10-05T07:45:00Z", by: "Luca P." }],
  },
  {
    id: "s-104",
    competitorId: "nordica",
    category: "price",
    title: "Listino rivenditori +3,5% sulle scrivanie",
    before: "Scrivania Linea 160: 410 €",
    after: "Scrivania Linea 160: 424 €",
    sourceId: "src-nordica-listino",
    observedAt: "2026-10-01T09:00:00Z",
    interpretation: "Aumento allineato all'inflazione dei materiali; lascia spazio di prezzo sulle scrivanie.",
    status: "verified",
    history: [
      { status: "to_verify", at: "2026-10-01T09:00:00Z", by: "Luca P." },
      { status: "verified", at: "2026-10-01T12:20:00Z", by: "Marco T." },
    ],
  },
  {
    id: "s-105",
    competitorId: "brio",
    category: "promotion",
    title: "Spedizione gratuita sopra i 300 euro",
    before: "Gratuita sopra 500 €",
    after: "Gratuita sopra 300 €",
    sourceId: "src-brio-offerte",
    observedAt: "2026-10-07T16:10:00Z",
    interpretation: "Abbassa la soglia per gli ordini medi delle piccole aziende.",
    status: "to_verify",
    history: [{ status: "to_verify", at: "2026-10-07T16:10:00Z", by: "Giulia R." }],
  },
  {
    id: "s-106",
    competitorId: "brio",
    category: "assortment",
    title: "Nuova linea di prodotti ricondizionati",
    before: "Nessun ricondizionato",
    after: "42 articoli ricondizionati",
    sourceId: "src-brio-novita",
    observedAt: "2026-10-08T08:00:00Z",
    interpretation: "Primo competitor a proporre il ricondizionato nel nostro segmento.",
    status: "to_verify",
    history: [{ status: "to_verify", at: "2026-10-08T08:00:00Z", by: "Luca P." }],
  },
  {
    id: "s-107",
    competitorId: "vela",
    category: "price",
    title: "Piano Base: prezzo invariato dopo il test A/B",
    before: "19 € / mese",
    after: "19 € / mese",
    sourceId: "src-vela-prezzi",
    observedAt: "2026-09-28T09:00:00Z",
    interpretation: "Il prezzo di 17 € visto il 26 settembre era un test, non un cambio di listino.",
    status: "discarded",
    history: [
      { status: "to_verify", at: "2026-09-26T09:00:00Z", by: "Giulia R." },
      { status: "discarded", at: "2026-09-28T09:00:00Z", by: "Marco T." },
    ],
  },
];

export const briefings: Briefing[] = [
  {
    id: "b-12",
    title: "Briefing commerciale · settimana 40",
    date: "2026-10-03T09:30:00Z",
    period: "28 settembre – 3 ottobre 2026",
    status: "sent",
    intro: "Settimana dominata dai prezzi: Vela abbassa il piano Pro e Nordica alza il listino delle scrivanie.",
    signalIds: ["s-101", "s-104"],
  },
  {
    id: "b-13",
    title: "Briefing commerciale · settimana 41",
    date: "2026-10-09T08:00:00Z",
    period: "4 – 9 ottobre 2026",
    status: "draft",
    intro: "Due promozioni da seguire prima della fine del mese.",
    signalIds: ["s-102"],
  },
];

export const members: Member[] = [
  { id: "m-1", name: "Marco T.", email: "marco@acme.example", role: "owner", joinedAt: "2026-09-10T09:00:00Z" },
  { id: "m-2", name: "Giulia R.", email: "giulia@acme.example", role: "editor", joinedAt: "2026-09-11T09:00:00Z" },
  { id: "m-3", name: "Luca P.", email: "luca@acme.example", role: "editor", joinedAt: "2026-09-15T09:00:00Z" },
  { id: "m-4", name: "", email: "direzione@acme.example", role: "viewer", joinedAt: null },
];

export const getCompetitor = (id: string) => competitors.find((c) => c.id === id);
export const getSource = (id: string) => sources.find((s) => s.id === id);
export const getSignal = (id: string) => signals.find((s) => s.id === id);
export const getBriefing = (id: string) => briefings.find((b) => b.id === id);
export const signalsForSource = (id: string) => signals.filter((s) => s.sourceId === id);
export const signalsForCompetitor = (id: string) => signals.filter((s) => s.competitorId === id);
export const briefingsForSignal = (id: string) => briefings.filter((b) => b.signalIds.includes(id));
