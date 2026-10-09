import { NextResponse } from "next/server";
import { cronGuard } from "@/lib/email/cron";
import { SITE_URL } from "@/lib/email/html";
import { checkSite } from "@/lib/email/monitor";
import { internalRecipients, sendingMode, sendMany } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Once a day (vercel.json): the public pages must answer 200, otherwise the team gets an alert.
// It runs on Vercel itself, so it catches broken pages and deploys, not a full Vercel outage.
export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;
  const site = (process.env.SITE_URL ?? SITE_URL).replace(/\/$/, "");
  const controllatoIl = new Date().toISOString();
  const { controllati, problemi } = await checkSite(site);
  if (!problemi.length) return NextResponse.json({ ok: true, controllati, problemi: 0 });
  const count = await sendMany(
    internalRecipients().map((to) => ({
      kind: "sito-non-risponde" as const,
      to,
      data: { controllatoIl, controllati, problemi },
      idempotencyKey: `sito-${controllatoIl.slice(0, 13)}-${to}`,
    })),
  );
  return NextResponse.json({ ok: false, modalita: sendingMode(), controllati, problemi, ...count });
}
