import { NextResponse } from "next/server";
import { cronGuard } from "@/lib/email/cron";
import { weeklySummaries } from "@/lib/email/data";
import { sendingMode, sendMany } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Every Monday (vercel.json): the summary of last week's signals to each member.
export async function GET(request: Request) {
  const denied = cronGuard(request);
  if (denied) return denied;
  const { origine, jobs } = await weeklySummaries(new Date());
  const count = await sendMany(
    jobs.map((j) => ({
      kind: "riepilogo-settimanale" as const,
      to: j.to,
      data: j.data,
      idempotencyKey: `riepilogo-${j.key}`,
      headers: { "List-Unsubscribe": "<mailto:ciao@competia.work?subject=Niente%20riepilogo%20settimanale>" },
    })),
  );
  return NextResponse.json({ ok: true, modalita: sendingMode(), origine, email: jobs.length, ...count });
}
