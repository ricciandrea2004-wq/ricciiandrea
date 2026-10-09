import { NextResponse } from "next/server";
import { standardWebhookOk } from "@/lib/email/auth";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supabase Auth "Send Email" hook: Supabase hands us the link and code, and we send them with our
// template instead of Supabase's default email. Turned on in Supabase (Authentication → Hooks →
// Send Email → HTTPS, this URL) with the secret it generates saved here as SEND_EMAIL_HOOK_SECRET.
type Payload = {
  user?: { email?: string; new_email?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
    token_hash_new?: string;
  };
};

function hookError(status: number, message: string) {
  return NextResponse.json({ error: { http_code: status, message } }, { status });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (!standardWebhookOk(request.headers, raw, process.env.SEND_EMAIL_HOOK_SECRET)) {
    return hookError(401, "Firma non valida");
  }
  const payload = JSON.parse(raw) as Payload;
  const email = payload.user?.email;
  const d = payload.email_data;
  const supabase = process.env.SUPABASE_URL;
  if (!email || !d?.token_hash || !d.email_action_type || !supabase) return hookError(400, "Dati mancanti");

  const verify = (hash: string) =>
    `${supabase}/auth/v1/verify?token=${encodeURIComponent(hash)}&type=${encodeURIComponent(d.email_action_type!)}` +
    (d.redirect_to ? `&redirect_to=${encodeURIComponent(d.redirect_to)}` : "");
  const url = verify(d.token_hash);
  const key = `auth-${d.token_hash.slice(0, 32)}`;

  const result =
    d.email_action_type === "invite"
      ? await sendEmail({ kind: "accesso-approvato", to: email, data: { url }, idempotencyKey: key })
      : await sendEmail({
          kind: "link-accesso",
          to: email,
          data: {
            url,
            codice: d.token,
            tipo: d.email_action_type === "email_change" ? "conferma" : "accesso",
          },
          idempotencyKey: key,
        });

  // Supabase shows the hook's error to the person trying to sign in, so it must be clear.
  if (result.status === "skipped") return hookError(503, "Invio email non attivo (EMAIL_SENDING).");
  if (result.status === "failed") return hookError(502, "Invio email non riuscito.");
  return NextResponse.json({});
}
