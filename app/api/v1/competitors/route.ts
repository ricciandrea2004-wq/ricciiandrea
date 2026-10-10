import { checkBearer, fail, ok, readJson, withStore } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  return withStore(async (store) => ok(await store.listCompetitors(), store));
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return fail(400, "bad_request", "Il corpo deve essere un oggetto JSON.");

  const details: Record<string, string> = {};
  const name = text(body.name, 120);
  if (!name) details.name = "Obbligatorio.";
  let website = text(body.website, 2000);
  if (website) {
    try {
      const url = new URL(website);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
      website = url.toString();
    } catch {
      details.website = "Indirizzo non valido: serve http:// o https://.";
    }
  }
  if (Object.keys(details).length > 0) return fail(400, "bad_request", "Dati non validi.", details);

  return withStore(async (store) => {
    const existing = (await store.listCompetitors()).find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return fail(409, "conflict", "Esiste già un competitor con questo nome.", { id: existing.id });
    const competitor = await store.addCompetitor({
      name,
      sector: text(body.sector, 80),
      website,
      note: text(body.note, 1000),
    });
    return ok(competitor, store, 201);
  });
}
