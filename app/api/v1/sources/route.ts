import { checkBearer, fail, ok, readJson, withStore } from "@/lib/api";
import { categories, type Category, type SourceStatus } from "@/lib/domain";
import { assertUrlShape, ScrapeError } from "@/lib/scraper/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: SourceStatus[] = ["active", "paused", "error", "blocked"];

export async function GET(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  if (status && !STATUSES.includes(status as SourceStatus)) {
    return fail(400, "bad_request", "Stato non valido.", { status: STATUSES.join(", ") });
  }
  return withStore(async (store) =>
    ok(
      await store.listSources({
        competitorId: params.get("competitorId") ?? undefined,
        status: (status as SourceStatus | null) ?? undefined,
      }),
      store,
    ),
  );
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return fail(400, "bad_request", "Il corpo deve essere un oggetto JSON.");

  const details: Record<string, string> = {};
  const competitorId = text(body.competitorId, 100);
  const category = text(body.category, 20) as Category;
  const rawUrl = text(body.url, 2000);
  const selector = text(body.selector, 200) || null;
  if (!competitorId) details.competitorId = "Obbligatorio.";
  if (!categories.includes(category)) details.category = `Uno tra: ${categories.join(", ")}.`;
  let url: URL | null = null;
  try {
    url = new URL(rawUrl);
    url.hash = "";
    assertUrlShape(url);
  } catch (err) {
    details.url = err instanceof ScrapeError ? err.message : "URL non valido.";
  }
  if (Object.keys(details).length > 0 || !url) return fail(400, "bad_request", "Dati non validi.", details);

  return withStore(async (store) => {
    if (!(await store.getCompetitor(competitorId))) {
      return fail(404, "not_found", "Competitor non trovato.", { competitorId });
    }
    const normalized = url.toString();
    const existing = await store.findSourceByUrl(competitorId, normalized);
    if (existing) return fail(409, "conflict", "Questa fonte esiste già.", { id: existing.id });
    const source = await store.addSource({
      competitorId,
      url: normalized,
      category,
      label: text(body.label, 120) || url.hostname + url.pathname,
      note: text(body.note, 1000),
      selector,
    });
    return ok(source, store, 201);
  });
}
