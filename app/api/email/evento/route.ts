import { NextResponse } from "next/server";
import { bearerOk } from "@/lib/email/auth";
import { sendEmail } from "@/lib/email/send";
import type { AccessoApprovato, Benvenuto } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Event-triggered emails for callers outside this app: a Supabase database webhook, an admin
// script. `Authorization: Bearer $EMAIL_EVENTS_SECRET`. Routes inside the app call sendEmail().
//
//   POST /api/email/evento
//   { "tipo": "richiesta-ricevuta" | "accesso-approvato" | "benvenuto", "a": "nome@azienda.it", "dati": { … } }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = { tipo?: unknown; a?: unknown; dati?: unknown; id?: unknown };

export async function POST(request: Request) {
  if (!bearerOk(request, process.env.EMAIL_EVENTS_SECRET)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 401 });
  }
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON non valido" }, { status: 400 });
  }
  const to = typeof body.a === "string" ? body.a.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(to)) return NextResponse.json({ ok: false, error: "Destinatario non valido" }, { status: 400 });
  const dati = (body.dati && typeof body.dati === "object" ? body.dati : {}) as Record<string, unknown>;
  const key = typeof body.id === "string" && body.id ? `evento-${body.id}` : undefined;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

  let result;
  switch (body.tipo) {
    case "richiesta-ricevuta":
      result = await sendEmail({ kind: "richiesta-ricevuta", to, data: {}, idempotencyKey: key });
      break;
    case "accesso-approvato": {
      const url = str(dati.url);
      if (!url?.startsWith("https://")) return NextResponse.json({ ok: false, error: "dati.url mancante" }, { status: 400 });
      const data: AccessoApprovato = { url, organizzazione: str(dati.organizzazione), invitatoDa: str(dati.invitatoDa) };
      result = await sendEmail({ kind: "accesso-approvato", to, data, idempotencyKey: key });
      break;
    }
    case "benvenuto": {
      const data: Benvenuto = { nome: str(dati.nome), organizzazione: str(dati.organizzazione) };
      result = await sendEmail({ kind: "benvenuto", to, data, idempotencyKey: key });
      break;
    }
    default:
      return NextResponse.json({ ok: false, error: "tipo sconosciuto" }, { status: 400 });
  }
  return NextResponse.json({ ok: result.status !== "failed", ...result }, { status: result.status === "failed" ? 502 : 200 });
}
