// Same endpoint as competia/landing/app/api/access-request/route.ts (owned by the Supabase + Resend thread).
// Keep the two in sync until the landing moves into this site.
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONFIRMATION_TEXT = [
  "Ciao,",
  "",
  "grazie per aver richiesto l'accesso a Competia.Work. Ti scriveremo appena lo spazio di pilot sarà disponibile.",
  "",
  "Se non sei stato tu a fare questa richiesta, puoi ignorare questa email.",
  "",
  "Competia.Work",
].join("\n");

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Richiesta non valida.", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return fail("Inserisci un'email valida.", 400);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!supabaseUrl || !supabaseKey || !resendKey || !from) {
    return fail("Servizio non configurato. Riprova più tardi.", 500);
  }

  // Global cap: the database allows at most 100 stored requests per hour, so a bot
  // cannot send unlimited confirmation emails. Fails closed if the check itself fails.
  const cap = await fetch(`${supabaseUrl}/rest/v1/rpc/access_request_allowed`, {
    method: "POST",
    headers: { apikey: supabaseKey, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!cap.ok) {
    return fail("Servizio non disponibile. Riprova più tardi.", 502);
  }
  if ((await cap.json()) !== true) {
    return fail("Troppe richieste in poco tempo. Riprova tra un'ora.", 429);
  }

  // Send the confirmation first: if it fails, nothing is stored and a retry is safe.
  const mail = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Abbiamo ricevuto la tua richiesta di accesso",
      text: CONFIRMATION_TEXT,
    }),
    cache: "no-store",
  });
  if (!mail.ok) {
    return fail("Non siamo riusciti a inviare la conferma. Riprova tra poco.", 502);
  }

  // The function gives the same answer whether or not the email is already on the list,
  // so the form never reveals who has requested access.
  const insert = await fetch(`${supabaseUrl}/rest/v1/rpc/request_access`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_email: email }),
    cache: "no-store",
  });
  if (!insert.ok) {
    return fail("Non siamo riusciti a salvare la richiesta. Riprova tra poco.", 502);
  }

  return NextResponse.json({ ok: true });
}
