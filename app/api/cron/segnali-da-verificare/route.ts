import { NextResponse } from "next/server";
import { cronGuard } from "@/lib/email/cron";
import { staleSignalAlerts } from "@/lib/email/data";
import { sendingMode, sendMany } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every morning (vercel.json): signals left "Da verificare" past the threshold, once per signal.
export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;
  const { origine, jobs } = await staleSignalAlerts(new Date());
  const count = await sendMany(
    jobs.map((j) => ({ kind: "segnali-da-verificare" as const, to: j.to, data: j.data, idempotencyKey: `fermi-${j.key}` })),
  );
  return NextResponse.json({ ok: true, modalita: sendingMode(), origine, email: jobs.length, ...count });
}
