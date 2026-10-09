// One scrape run: picks the sources checked least recently, fetches each page once, and turns a
// change against the previous snapshot into a signal to verify. Small by design: a run has a source
// limit and a time budget, and waits between two requests to the same host.
import type { Signal, Source } from "../domain";
import type { Store } from "../store/types";
import { diffLines, excerpt, firstPrice, hasChanges } from "./diff";
import { htmlToText, normalizeText, pageTitle, sha256 } from "./extract";
import { fetchText, ScrapeError, type FetchOptions } from "./net";
import { loadRobots, type Robots } from "./robots";

export type ScrapeOutcome = "baseline" | "unchanged" | "changed" | "blocked" | "error" | "skipped";

export type ScrapeResult = {
  sourceId: string;
  url: string;
  outcome: ScrapeOutcome;
  signalId?: string;
  message?: string;
  durationMs: number;
};

export type ScrapeRunOptions = {
  sourceIds?: string[];
  limit?: number;
  budgetMs?: number;
  minHostDelayMs?: number;
  fetchOptions?: FetchOptions;
};

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 25;
const DEFAULT_BUDGET_MS = 45_000;
const DEFAULT_HOST_DELAY_MS = 5_000;
const MAX_CRAWL_DELAY_MS = 30_000;
const AUTHOR = "Competia (automatico)";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function pickSources(store: Store, options: ScrapeRunOptions): Promise<Source[]> {
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  if (options.sourceIds && options.sourceIds.length > 0) {
    const found = await Promise.all(options.sourceIds.slice(0, limit).map((id) => store.getSource(id)));
    return found.filter((s): s is Source => s !== null);
  }
  const all = await store.listSources();
  return all
    .filter((s) => s.status !== "paused")
    .sort((a, b) => (a.lastCheckedAt ?? "").localeCompare(b.lastCheckedAt ?? ""))
    .slice(0, limit);
}

export async function runScrape(store: Store, options: ScrapeRunOptions = {}) {
  const startedAt = Date.now();
  const budget = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const minDelay = options.minHostDelayMs ?? DEFAULT_HOST_DELAY_MS;
  const sources = await pickSources(store, options);
  const competitors = new Map((await store.listCompetitors()).map((c) => [c.id, c.name]));
  const robotsByOrigin = new Map<string, Robots>();
  const lastHitByHost = new Map<string, number>();
  const results: ScrapeResult[] = [];

  for (const source of sources) {
    const t0 = Date.now();
    const done = (outcome: ScrapeOutcome, extra: Partial<ScrapeResult> = {}) =>
      results.push({ sourceId: source.id, url: source.url, outcome, durationMs: Date.now() - t0, ...extra });

    let url: URL;
    try {
      url = new URL(source.url);
    } catch {
      await store.recordCheck(source.id, { status: "error", lastCheckedAt: new Date().toISOString(), lastError: "URL non valido." });
      done("error", { message: "URL non valido." });
      continue;
    }

    const robots = robotsByOrigin.get(url.origin);
    const crawlDelayMs = Math.min((robots?.crawlDelaySeconds ?? 0) * 1000, MAX_CRAWL_DELAY_MS);
    const wait = Math.max(0, (lastHitByHost.get(url.host) ?? 0) + Math.max(minDelay, crawlDelayMs) - Date.now());
    if (Date.now() - startedAt + wait > budget) {
      done("skipped", { message: "Tempo del giro esaurito: la fonte passa al prossimo." });
      continue;
    }
    if (wait > 0) await sleep(wait);

    try {
      const result = await checkSource(store, source, url, competitors.get(source.competitorId), robotsByOrigin, options.fetchOptions);
      lastHitByHost.set(url.host, Date.now());
      done(result.outcome, result);
    } catch (err) {
      lastHitByHost.set(url.host, Date.now());
      const message = err instanceof ScrapeError ? err.message : "Errore imprevisto durante il controllo.";
      if (!(err instanceof ScrapeError)) console.error("scrape", source.id, err);
      await store.recordCheck(source.id, { status: "error", lastCheckedAt: new Date().toISOString(), lastError: message });
      done("error", { message });
    }
  }

  return {
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    checked: results.filter((r) => r.outcome !== "skipped").length,
    changed: results.filter((r) => r.outcome === "changed").length,
    results,
  };
}

async function checkSource(
  store: Store,
  source: Source,
  url: URL,
  competitorName: string | undefined,
  robotsByOrigin: Map<string, Robots>,
  fetchOptions: FetchOptions | undefined,
): Promise<{ outcome: ScrapeOutcome; signalId?: string; message?: string }> {
  let robots = robotsByOrigin.get(url.origin);
  if (!robots) {
    robots = await loadRobots(url.origin, fetchOptions);
    robotsByOrigin.set(url.origin, robots);
  }
  if (robots.unavailable) throw new ScrapeError("network", robots.unavailable);
  const now = new Date().toISOString();
  if (!robots.isAllowed(url.pathname + url.search)) {
    const message = "robots.txt non permette di leggere questa pagina.";
    await store.recordCheck(source.id, { status: "blocked", lastCheckedAt: now, lastError: message });
    return { outcome: "blocked", message };
  }

  const page = await fetchText(source.url, fetchOptions);
  if (page.status === 403 || page.status === 429) {
    throw new ScrapeError("http", `La pagina ha rifiutato la richiesta (HTTP ${page.status}).`);
  }
  if (page.status >= 400) throw new ScrapeError("http", `La pagina risponde con HTTP ${page.status}.`);

  const type = page.contentType.toLowerCase();
  let text: string;
  let title: string | null = null;
  if (type.includes("html") || type === "") {
    text = htmlToText(page.body, source.selector);
    title = pageTitle(page.body);
  } else if (type.startsWith("text/plain")) {
    text = normalizeText(page.body);
  } else if (type.includes("pdf")) {
    throw new ScrapeError("unsupported", "I PDF non sono ancora supportati.");
  } else {
    throw new ScrapeError("unsupported", `Tipo di contenuto non supportato (${type.split(";")[0]}).`);
  }
  if (!text) {
    throw new ScrapeError("empty", "La pagina non ha testo leggibile: forse viene caricata con JavaScript.");
  }

  const hash = sha256(text);
  const previous = await store.latestSnapshot(source.id);
  if (previous && previous.contentHash === hash) {
    await store.recordCheck(source.id, { status: "active", lastCheckedAt: now, lastError: null });
    return { outcome: "unchanged" };
  }

  await store.addSnapshot({
    sourceId: source.id,
    fetchedAt: now,
    finalUrl: page.url,
    httpStatus: page.status,
    contentHash: hash,
    title,
    text,
  });

  if (!previous) {
    await store.recordCheck(source.id, { status: "active", lastCheckedAt: now, lastError: null });
    return { outcome: "baseline", message: "Prima copia salvata: i cambiamenti si vedono dal prossimo controllo." };
  }

  const diff = diffLines(previous.text, text);
  if (!hasChanges(diff)) {
    // Same lines in a different order: saved, but not a signal.
    await store.recordCheck(source.id, { status: "active", lastCheckedAt: now, lastError: null });
    return { outcome: "unchanged", message: "Cambia solo l'ordine delle righe." };
  }

  const signal = await store.addSignal(buildSignal(source, competitorName, diff, now));
  await store.recordCheck(source.id, { status: "active", lastCheckedAt: now, lastError: null, lastObservedAt: now });
  return { outcome: "changed", signalId: signal.id };
}

const lines = (n: number, one: string, many: string) => (n === 1 ? `1 riga ${one}` : `${n} righe ${many}`);

export function buildSignal(
  source: Source,
  competitorName: string | undefined,
  diff: { added: string[]; removed: string[] },
  at: string,
): Omit<Signal, "id"> {
  const where = competitorName ? `${competitorName}, ${source.label}` : source.label;
  const oldPrice = source.category === "price" ? firstPrice(diff.removed) : null;
  const newPrice = source.category === "price" ? firstPrice(diff.added) : null;
  const title =
    oldPrice && newPrice && oldPrice !== newPrice
      ? `${where}: prezzo da ${oldPrice} a ${newPrice}`
      : `${where}: la pagina è cambiata (${lines(diff.added.length, "nuova", "nuove")}, ${lines(diff.removed.length, "tolta", "tolte")})`;
  return {
    competitorId: source.competitorId,
    category: source.category,
    title,
    before: excerpt(diff.removed) || "Niente",
    after: excerpt(diff.added) || "Niente",
    sourceId: source.id,
    observedAt: at,
    interpretation: "Rilevato automaticamente dal confronto con la copia precedente della pagina. Da verificare.",
    status: "to_verify",
    history: [{ status: "to_verify", at, by: AUTHOR }],
  };
}
