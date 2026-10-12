import { checkBearer, ok, withStore } from "@/lib/api";
import { CRON_BUDGET_MS, CRON_LIMIT, runScrape } from "@/lib/scraper/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby allows up to 300 s; the run stops itself at about 270 s and the rest waits for tomorrow.
export const maxDuration = 300;

// Called once a day by Vercel Cron (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET"
// when the CRON_SECRET variable is set; without it the route answers 503 and does nothing.
export async function GET(request: Request) {
  const denied = checkBearer(request, "CRON_SECRET");
  if (denied) return denied;
  return withStore(async (store) => {
    const run = await runScrape(store, { trigger: "cron", limit: CRON_LIMIT, budgetMs: CRON_BUDGET_MS });
    try {
      await store.pruneHistory();
    } catch (err) {
      console.error("scrape prune", err);
    }
    console.log(
      `cron scrape: ${run.due} da controllare, ${run.checked} controllate, ${run.changed} cambiate, ${run.failed} errori, ${run.durationMs} ms`,
    );
    return ok(run, store);
  });
}
