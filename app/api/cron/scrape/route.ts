import { checkBearer, ok, withStore } from "@/lib/api";
import { runScrape } from "@/lib/scraper/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called once a day by Vercel Cron (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET"
// when the CRON_SECRET variable is set; without it the route answers 503 and does nothing.
export async function GET(request: Request) {
  const denied = checkBearer(request, "CRON_SECRET");
  if (denied) return denied;
  return withStore(async (store) => {
    const run = await runScrape(store);
    console.log(`cron scrape: ${run.checked} controllate, ${run.changed} cambiate, ${run.durationMs} ms`);
    return ok(run, store);
  });
}
