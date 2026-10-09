import { checkBearer, fail, ok, readJson, withStore } from "@/lib/api";
import { MAX_LIMIT, runScrape } from "@/lib/scraper/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby allows up to 300 s; a run stops itself after about 45 s, so 60 s leaves margin.
export const maxDuration = 60;

// Runs the scraper now. Body (optional): { "sourceIds": ["..."], "limit": 10 }.
export async function POST(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const body = (await readJson(request)) ?? {};
  const details: Record<string, string> = {};

  let sourceIds: string[] | undefined;
  if (body.sourceIds !== undefined) {
    if (!Array.isArray(body.sourceIds) || !body.sourceIds.every((id) => typeof id === "string")) {
      details.sourceIds = "Elenco di id di fonti.";
    } else {
      sourceIds = body.sourceIds as string[];
    }
  }
  let limit: number | undefined;
  if (body.limit !== undefined) {
    if (typeof body.limit !== "number" || !Number.isInteger(body.limit) || body.limit < 1 || body.limit > MAX_LIMIT) {
      details.limit = `Numero intero tra 1 e ${MAX_LIMIT}.`;
    } else {
      limit = body.limit;
    }
  }
  if (Object.keys(details).length > 0) return fail(400, "bad_request", "Dati non validi.", details);

  return withStore(async (store) => ok(await runScrape(store, { sourceIds, limit }), store));
}
