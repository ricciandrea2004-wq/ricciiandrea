import { checkBearer, ok, withStore } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = checkBearer(request, "COMPETIA_API_TOKEN");
  if (denied) return denied;
  return withStore(async (store) => ok(await store.listCompetitors(), store));
}
