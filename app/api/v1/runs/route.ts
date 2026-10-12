import { checkBearer, fail, ok, withStore } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The latest scraper runs, newest first: how many sources were due, read, changed and failed.
export async function GET(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const raw = new URL(request.url).searchParams.get("limit");
  const limit = raw === null ? 20 : Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return fail(400, "bad_request", "Dati non validi.", { limit: "Numero intero tra 1 e 100." });
  }
  return withStore(async (store) => ok(await store.listRuns(limit), store));
}
