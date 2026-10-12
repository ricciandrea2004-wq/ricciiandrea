import { checkBearer, fail, ok, readJson, withStore } from "@/lib/api";
import type { SourceStatus } from "@/lib/domain";
import { isValidInterval, MAX_INTERVAL_HOURS, MIN_INTERVAL_HOURS, nextCheckAt } from "@/lib/scraper/schedule";
import type { SourcePatch } from "@/lib/store/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const { id } = await params;
  return withStore(async (store) => {
    const source = await store.getSource(id);
    if (!source) return fail(404, "not_found", "Fonte non trovata.");
    const [snapshot, recentChecks] = await Promise.all([store.latestSnapshot(id), store.listChecks(id, 10)]);
    return ok(
      {
        ...source,
        nextCheckAt: nextCheckAt(source),
        recentChecks,
        latestSnapshot: snapshot && {
          fetchedAt: snapshot.fetchedAt,
          finalUrl: snapshot.finalUrl,
          httpStatus: snapshot.httpStatus,
          contentHash: snapshot.contentHash,
          title: snapshot.title,
          textPreview: snapshot.text.slice(0, 1000),
        },
      },
      store,
    );
  });
}

// Pause or resume a source, or change its label, note, selector or check interval.
export async function PATCH(request: Request, { params }: Context) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const { id } = await params;
  const body = await readJson(request);
  if (!body) return fail(400, "bad_request", "Il corpo deve essere un oggetto JSON.");

  const patch: SourcePatch = {};
  if (typeof body.label === "string" && body.label.trim()) patch.label = body.label.trim().slice(0, 120);
  if (typeof body.note === "string") patch.note = body.note.trim().slice(0, 1000);
  if (body.selector === null || typeof body.selector === "string") {
    patch.selector = typeof body.selector === "string" && body.selector.trim() ? body.selector.trim().slice(0, 200) : null;
  }
  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "paused") {
      return fail(400, "bad_request", "Dati non validi.", { status: "Uno tra: active, paused." });
    }
    patch.status = body.status as SourceStatus;
  }
  if (body.checkIntervalHours !== undefined) {
    if (!isValidInterval(body.checkIntervalHours)) {
      return fail(400, "bad_request", "Dati non validi.", {
        checkIntervalHours: `Ore intere tra ${MIN_INTERVAL_HOURS} e ${MAX_INTERVAL_HOURS}.`,
      });
    }
    patch.checkIntervalHours = body.checkIntervalHours;
  }
  if (Object.keys(patch).length === 0) {
    return fail(400, "bad_request", "Niente da aggiornare: usa label, note, selector, status o checkIntervalHours.");
  }
  return withStore(async (store) => {
    const source = await store.updateSource(id, patch);
    return source ? ok(source, store) : fail(404, "not_found", "Fonte non trovata.");
  });
}
