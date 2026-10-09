import { NextResponse } from "next/server";
import { bearerOk } from "./auth";

// Vercel Cron calls these routes with `Authorization: Bearer $CRON_SECRET`.
// Without CRON_SECRET set, they refuse every call.
export function cronGuard(request: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ ok: false, error: "CRON_SECRET non impostato" }, { status: 503 });
  if (!bearerOk(request, process.env.CRON_SECRET)) return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  return null;
}
