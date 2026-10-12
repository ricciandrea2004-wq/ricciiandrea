import { checkBearer, fail, ok, withStore } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// One run with every page it read, errors included.
export async function GET(request: Request, { params }: Context) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  const { id } = await params;
  return withStore(async (store) => {
    const run = await store.getRun(id);
    return run ? ok(run, store) : fail(404, "not_found", "Giro non trovato.");
  });
}
