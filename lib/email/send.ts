// The one place that sends email. Routes, crons and hooks call sendEmail(); nothing else
// talks to Resend for these templates.
//
// Everything is behind the EMAIL_SENDING flag, so nothing reaches real people until it is on:
//   off (default, also when unset)  nothing is sent; the email is rendered and logged
//   interno                         only to the team addresses in EMAIL_INTERNAL_TO
//   on                              to everyone
import { renderEmail, type EmailData, type EmailKind } from "./templates";

export type SendingMode = "off" | "interno" | "on";

export function sendingMode(): SendingMode {
  const v = (process.env.EMAIL_SENDING ?? "").trim().toLowerCase();
  return v === "on" || v === "interno" ? v : "off";
}

/** Team addresses: they get the operational alerts and are the only recipients in "interno". */
export function internalRecipients(): string[] {
  return (process.env.EMAIL_INTERNAL_TO ?? "ciao@competia.work")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export type SendResult =
  | { status: "sent"; id: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export type SendInput<K extends EmailKind> = {
  kind: K;
  to: string;
  data: EmailData[K];
  /** Same key → Resend sends once (24 h), so a retried cron or webhook does not send twice. */
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

function allowed(to: string): string | null {
  const mode = sendingMode();
  if (mode === "off") return "EMAIL_SENDING è spento";
  if (mode === "interno" && !internalRecipients().includes(to.toLowerCase())) {
    return "EMAIL_SENDING=interno e il destinatario non è nel team";
  }
  return null;
}

// Recipients are never written to the logs in full.
const mask = (email: string) => email.replace(/^(.).*(@.*)$/, "$1…$2");

export async function sendEmail<K extends EmailKind>(input: SendInput<K>): Promise<SendResult> {
  const { kind, to, data } = input;
  const email = renderEmail(kind, data);
  const blocked = allowed(to);
  if (blocked) {
    console.info(`[email] ${kind} → ${mask(to)} non inviata: ${blocked}`);
    return { status: "skipped", reason: blocked };
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return { status: "failed", error: "RESEND_API_KEY o RESEND_FROM mancanti" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: "ciao@competia.work",
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers: input.headers,
      tags: [{ name: "tipo", value: kind }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const error = `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
    console.error(`[email] ${kind} → ${mask(to)} fallita: ${error}`);
    return { status: "failed", error };
  }
  const { id } = (await res.json()) as { id: string };
  console.info(`[email] ${kind} → ${mask(to)} inviata (${id})`);
  return { status: "sent", id };
}

/** Sends a list one by one, under Resend's rate limit, and counts the outcomes. */
export async function sendMany<K extends EmailKind>(inputs: SendInput<K>[]) {
  const count = { sent: 0, skipped: 0, failed: 0 };
  for (const input of inputs) {
    const r = await sendEmail(input);
    count[r.status]++;
    if (r.status === "sent") await new Promise((ok) => setTimeout(ok, 250));
  }
  return count;
}
