import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { loadBundle } from "@/lib/data";
import { topIntersectionsExport } from "@/lib/metrics";

export const dynamic = "force-static";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(5, Number(url.searchParams.get("limit") || 25)));
  const bundle = await loadBundle();
  const rows = topIntersectionsExport(bundle, limit);
  const csv = toCsv(
    ["key", "code", "name", "total", "latitude", "longitude"],
    rows.map((r) => [r.key, r.code, r.name, Math.round(r.total), r.latitude, r.longitude]),
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vista-bari-intersections-top${limit}.csv"`,
      "Cache-Control": "public, s-maxage=300",
    },
  });
}
