// Domain types and Italian labels. Identifiers stay in English; labels shown to users are here.

export type Category = "price" | "assortment" | "promotion" | "news";
// active: checked by the scraper. paused: skipped. error: the last check failed. blocked: robots.txt disallows it.
export type SourceStatus = "active" | "paused" | "error" | "blocked";
export type SignalStatus = "to_verify" | "verified" | "in_briefing" | "discarded";
export type BriefingStatus = "draft" | "sent";
export type TagColor = "gray" | "blue" | "purple" | "orange" | "yellow" | "green" | "red";

export type Competitor = {
  id: string;
  name: string;
  sector: string;
  website: string;
  note: string;
};

export type Source = {
  id: string;
  competitorId: string;
  label: string;
  category: Category;
  url: string;
  addedAt: string;
  lastObservedAt: string;
  note: string;
  // Scraping. lastCheckedAt is the last fetch attempt; lastObservedAt the last time a change was seen.
  status: SourceStatus;
  lastCheckedAt: string | null;
  lastError: string | null;
  // Optional CSS selector that narrows the watched part of the page (for example "main" or "#prezzi").
  selector: string | null;
};

export type StatusChange = { status: SignalStatus; at: string; by: string };

export type Signal = {
  id: string;
  competitorId: string;
  category: Category;
  title: string;
  before: string;
  after: string;
  sourceId: string;
  observedAt: string;
  interpretation: string;
  status: SignalStatus;
  history: StatusChange[];
};

export type Briefing = {
  id: string;
  title: string;
  date: string;
  period: string;
  status: BriefingStatus;
  intro: string;
  signalIds: string[];
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string | null;
};

export const categoryLabel: Record<Category, string> = {
  price: "Prezzo",
  assortment: "Assortimento",
  promotion: "Promozione",
  news: "Notizia",
};

export const categoryColor: Record<Category, TagColor> = {
  price: "blue",
  assortment: "purple",
  promotion: "orange",
  news: "gray",
};

export const statusLabel: Record<SignalStatus, string> = {
  to_verify: "Da verificare",
  verified: "Verificato",
  in_briefing: "Nel briefing",
  discarded: "Scartato",
};

export const statusColor: Record<SignalStatus, TagColor> = {
  to_verify: "yellow",
  verified: "green",
  in_briefing: "blue",
  discarded: "red",
};

export const briefingStatusLabel: Record<BriefingStatus, string> = {
  draft: "Bozza",
  sent: "Inviato",
};

export const roleLabel: Record<Member["role"], string> = {
  owner: "Proprietario",
  editor: "Può modificare",
  viewer: "Sola lettura",
};

export const categories: Category[] = ["price", "assortment", "promotion", "news"];

export const sourceStatusLabel: Record<SourceStatus, string> = {
  active: "Attiva",
  paused: "In pausa",
  error: "Errore",
  blocked: "Bloccata da robots.txt",
};

export const sourceStatusColor: Record<SourceStatus, TagColor> = {
  active: "green",
  paused: "gray",
  error: "red",
  blocked: "red",
};
export const statuses: SignalStatus[] = ["to_verify", "verified", "in_briefing", "discarded"];

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome" });
const shortFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "Europe/Rome" });

export function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatShortDate(iso: string) {
  return shortFmt.format(new Date(iso));
}
