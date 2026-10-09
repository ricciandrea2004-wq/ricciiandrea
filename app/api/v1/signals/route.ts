import { checkBearer, fail, ok, withStore } from "@/lib/api";
import { categories, statuses, type Category, type SignalStatus } from "@/lib/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const details: Record<string, string> = {};

  const status = params.get("status");
  if (status && !statuses.includes(status as SignalStatus)) details.status = `Uno tra: ${statuses.join(", ")}.`;
  const category = params.get("category");
  if (category && !categories.includes(category as Category)) details.category = `Uno tra: ${categories.join(", ")}.`;
  const since = params.get("since");
  if (since && Number.isNaN(Date.parse(since))) details.since = "Data ISO 8601, per esempio 2026-10-01.";
  const limit = Number(params.get("limit") ?? 50);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) details.limit = "Numero intero tra 1 e 200.";
  if (Object.keys(details).length > 0) return fail(400, "bad_request", "Parametri non validi.", details);

  return withStore(async (store) =>
    ok(
      await store.listSignals({
        status: (status as SignalStatus | null) ?? undefined,
        category: (category as Category | null) ?? undefined,
        competitorId: params.get("competitorId") ?? undefined,
        sourceId: params.get("sourceId") ?? undefined,
        since: since ? new Date(since).toISOString() : undefined,
        limit,
      }),
      store,
    ),
  );
}
