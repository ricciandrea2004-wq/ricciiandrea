"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { withinLimits } from "@/lib/auth/rate-limit";
import { categories, type Category } from "@/lib/domain";
import { runScrape } from "@/lib/scraper/run";
import { assertUrlShape, ScrapeError } from "@/lib/scraper/net";
import { getStore, StoreConfigError, type Store } from "@/lib/store";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { currentUser, type CurrentUser } from "@/lib/supabase/server";

// What the workspace can change today: competitors, sources (with a first check right away),
// a check on demand, and invitations. Every action checks the session again, even though
// middleware.ts already closes /app: a server action can be called directly.

export type FormState = { error?: string; fields?: Record<string, string>; done?: string; values?: Record<string, string> };

const text = (form: FormData, name: string, max: number) => String(form.get(name) ?? "").trim().slice(0, max);

// React resets a form after its action runs: on an error the inputs get these values back.
const keep = (form: FormData) =>
  Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v).slice(0, 2000)]));

async function signedIn(): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect("/accedi");
  return user;
}

function liveStore(): Store | string {
  if (process.env.COMPETIA_STORE !== "supabase") return "Il workspace non è collegato al database: i dati sono di esempio.";
  try {
    return getStore();
  } catch (err) {
    if (err instanceof StoreConfigError) return `Il database non è configurato: manca ${err.missing.join(", ")}.`;
    throw err;
  }
}

function webAddress(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export async function addCompetitor(_: FormState, form: FormData): Promise<FormState> {
  await signedIn();
  const store = liveStore();
  if (typeof store === "string") return { error: store };

  const name = text(form, "name", 120);
  const rawSite = text(form, "website", 2000);
  const fields: Record<string, string> = {};
  if (!name) fields.name = "Scrivi il nome.";
  const site = rawSite ? webAddress(rawSite) : null;
  if (rawSite && !site) fields.website = "Indirizzo non valido: deve iniziare con http:// o https://.";
  if (Object.keys(fields).length > 0) return { error: "Controlla i campi segnati.", fields, values: keep(form) };

  const existing = (await store.listCompetitors()).find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return { error: "Esiste già un competitor con questo nome.", fields: { name: "Già presente." }, values: keep(form) };
  const competitor = await store.addCompetitor({ name, sector: text(form, "sector", 80), website: site?.toString() ?? "", note: text(form, "note", 1000) });
  revalidatePath("/app", "layout");
  redirect(`/app/competitor/${competitor.id}`);
}

export async function addSource(_: FormState, form: FormData): Promise<FormState> {
  const user = await signedIn();
  const store = liveStore();
  if (typeof store === "string") return { error: store };

  const competitorId = text(form, "competitorId", 100);
  const category = text(form, "category", 20) as Category;
  const fields: Record<string, string> = {};
  if (!competitorId || !(await store.getCompetitor(competitorId))) fields.competitorId = "Scegli il competitor.";
  if (!categories.includes(category)) fields.category = "Scegli la categoria.";
  const url = webAddress(text(form, "url", 2000));
  if (!url) fields.url = "Indirizzo non valido: deve iniziare con http:// o https://.";
  else {
    try {
      assertUrlShape(url);
    } catch (err) {
      fields.url = err instanceof ScrapeError ? err.message : "Indirizzo non valido.";
    }
  }
  if (Object.keys(fields).length > 0 || !url) return { error: "Controlla i campi segnati.", fields, values: keep(form) };

  const normalized = url.toString();
  if (await store.findSourceByUrl(competitorId, normalized)) {
    return { error: "Questa pagina è già tra le fonti di questo competitor.", fields: { url: "Già presente." }, values: keep(form) };
  }
  const source = await store.addSource({
    competitorId,
    url: normalized,
    category,
    label: text(form, "label", 120) || url.hostname + url.pathname,
    note: text(form, "note", 1000),
    selector: text(form, "selector", 200) || null,
  });
  // First read right away: it saves the starting copy, so the next change becomes a signal.
  if (await withinLimits([{ scope: "controllo:utente", id: user.id, max: 10, windowSeconds: 15 * 60 }])) {
    await runScrape(store, { sourceIds: [source.id], limit: 1, budgetMs: 25_000 }).catch((err) => console.error("[workspace] primo controllo", err));
  }
  revalidatePath("/app", "layout");
  redirect(`/app/fonti/${source.id}?aggiunta=1`);
}

const outcomeText: Record<string, string> = {
  baseline: "Prima lettura salvata: dal prossimo controllo ogni cambiamento diventa un segnale.",
  unchanged: "Nessun cambiamento dall'ultima lettura.",
  changed: "La pagina è cambiata: c'è un nuovo segnale da verificare.",
  blocked: "Il sito chiede di non leggere questa pagina (robots.txt): la fonte è segnata come bloccata.",
  error: "La pagina non ha risposto come previsto.",
  skipped: "Controllo rimandato: riprova tra poco.",
};

export async function checkSourceNow(_: FormState, form: FormData): Promise<FormState> {
  const user = await signedIn();
  const store = liveStore();
  if (typeof store === "string") return { error: store };
  const id = text(form, "sourceId", 100);
  if (!(await store.getSource(id))) return { error: "Fonte non trovata." };
  if (!(await withinLimits([{ scope: "controllo:utente", id: user.id, max: 10, windowSeconds: 15 * 60 }]))) {
    return { error: "Hai chiesto molti controlli di seguito. Riprova tra qualche minuto." };
  }
  const run = await runScrape(store, { sourceIds: [id], limit: 1, budgetMs: 25_000 });
  const result = run.results[0];
  revalidatePath("/app", "layout");
  if (!result) return { error: "Controllo non eseguito. Riprova tra poco." };
  const message = outcomeText[result.outcome] ?? "Controllo eseguito.";
  return result.outcome === "error" ? { error: `${message} ${result.message ?? ""}`.trim() } : { done: message };
}

export async function inviteMember(_: FormState, form: FormData): Promise<FormState> {
  const user = await signedIn();
  if (!user.admin) return { error: "Solo chi amministra lo spazio può invitare." };
  const email = text(form, "email", 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Scrivi un indirizzo email valido.", fields: { email: "Non valido." }, values: keep(form) };
  const admin = createSupabaseAdmin();
  if (!admin) return { error: "Gli inviti hanno bisogno della chiave di servizio di Supabase su questo sito." };
  if (!(await withinLimits([{ scope: "invito:utente", id: user.id, max: 20, windowSeconds: 60 * 60 }]))) {
    return { error: "Troppi inviti in poco tempo. Riprova più tardi." };
  }
  const h = await headers();
  const origin = h.get("origin") ?? "https://www.competia.work";
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/auth/confirm` });
  if (error) {
    if (error.code === "email_exists" || error.status === 422) return { error: "Questa persona ha già un account." };
    console.error(`[workspace] invito: ${error.code ?? error.status} ${error.message}`);
    return { error: "Invito non inviato. Riprova tra qualche minuto." };
  }
  revalidatePath("/app/impostazioni/membri");
  return { done: `Invito mandato a ${email}.` };
}
