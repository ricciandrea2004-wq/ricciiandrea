import { NextResponse } from "next/server";
import { loadBundle } from "@/lib/data";

export const dynamic = "force-static";

export async function GET() {
  const bundle = await loadBundle();
  return NextResponse.json({
    syncedAt: bundle.syncedAt,
    summary: bundle.summary,
    sources: bundle.sources,
    centralineCount: bundle.centraline.length,
    flowsCount: bundle.flows.length,
    accidentsCount: bundle.accidents.length,
  });
}
