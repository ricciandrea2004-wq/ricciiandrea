"use server";

import type { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/supabase/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { clientIp, withinLimits, type Limit } from "./rate-limit";
import { clearSignedIn, markSignedIn } from "./session-cookie";

// Every sign-in step of Competia: email and password (the default), a link and 6-digit code by
// email, password reset and sign-out. Accounts are created by invitation only, so nothing here
// signs anyone up. Every step is rate limited per email and per IP (lib/auth/rate-limit.ts), and
// the answers never say whether an address has an account.

export type AuthFormState = { error?: string; done?: boolean; email?: string };

const NOT_CONFIGURED = "L'accesso non è ancora configurato su questo sito.";
const TOO_MANY = "Troppi tentativi in poco tempo. Aspetta qualche minuto e riprova.";
const MIN_PASSWORD = 10;
const WINDOW = 15 * 60;

/** Limits for one kind of attempt: per email address and per IP, in a 15-minute window. */
async function allowed(kind: string, email: string, perEmail: number, perIp: number) {
  const limits: Limit[] = [
    { scope: `${kind}:ip`, id: await clientIp(), max: perIp, windowSeconds: WINDOW },
    { scope: `${kind}:email`, id: email || "-", max: perEmail, windowSeconds: WINDOW },
  ];
  return withinLimits(limits);
}

function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD) return `La password deve avere almeno ${MIN_PASSWORD} caratteri.`;
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return "Usa almeno una lettera e un numero.";
  if (password.length > 72) return "La password può avere al massimo 72 caratteri.";
  return null;
}

const field = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function siteOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.competia.work";
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

function message(error: AuthError, fallback: string) {
  switch (error.code) {
    case "invalid_credentials":
      return "Email o password non corretti. Se non hai ancora una password, entra con un codice via email.";
    case "email_not_confirmed":
      return "Questo indirizzo non è ancora confermato: entra con un codice via email.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Hai già fatto una richiesta da poco. Aspetta un minuto e riprova.";
    case "otp_expired":
      return "Il codice è scaduto o non è corretto. Richiedine uno nuovo.";
    case "weak_password":
      return `Password troppo debole: usa almeno ${MIN_PASSWORD} caratteri, con lettere e numeri.`;
    case "same_password":
      return "È uguale alla password attuale: scegline una diversa.";
    case "session_not_found":
    case "session_expired":
      return "La sessione è scaduta. Richiedi un nuovo link per reimpostare la password.";
    default:
      console.error(`[auth] ${error.code ?? error.status}: ${error.message}`);
      return fallback;
  }
}

function checkEmailUrl(email: string, extra: Record<string, string>) {
  const params = new URLSearchParams({ email, ...extra });
  return `/accedi/controlla-email?${params}`;
}

/** Sends the sign-in link (and code) by email. Unknown addresses get the same answer, so nobody can probe who has an account. */
export async function sendLoginLink(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = field(form, "email").toLowerCase();
  const next = safeNext(field(form, "next"));
  if (!isEmail(email)) return { error: "Scrivi un indirizzo email valido.", email };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NOT_CONFIGURED, email };
  if (!(await allowed("link", email, 4, 15))) return { error: TOO_MANY, email };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  // "otp_disabled" / "signup_disabled": no account for this address. Answer as if the link left.
  if (error && error.code !== "otp_disabled" && error.code !== "signup_disabled") {
    return { error: message(error, "Non siamo riusciti a mandare l'email. Riprova tra qualche minuto."), email };
  }
  redirect(checkEmailUrl(email, next === "/app" ? {} : { next }));
}

export async function signInWithPassword(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = field(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!isEmail(email)) return { error: "Scrivi un indirizzo email valido.", email };
  if (!password) return { error: "Scrivi la password.", email };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NOT_CONFIGURED, email };
  if (!(await allowed("password", email, 8, 30))) return { error: TOO_MANY, email };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: message(error, "Non siamo riusciti a farti entrare. Riprova tra qualche minuto."), email };
  await markSignedIn();
  redirect(safeNext(field(form, "next")));
}

/** The 6-digit code from the email, as an alternative to the link (another device, a blocked link). */
export async function verifyEmailCode(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = field(form, "email").toLowerCase();
  const token = field(form, "code").replace(/\s/g, "");
  const recovery = field(form, "tipo") === "recupero";
  if (!isEmail(email)) return { error: "Manca l'indirizzo email: torna alla pagina di accesso." };
  if (!/^\d{6}$/.test(token)) return { error: "Il codice è di 6 cifre." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NOT_CONFIGURED };
  if (!(await allowed("codice", email, 6, 30))) return { error: TOO_MANY };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: recovery ? "recovery" : "email" });
  if (error) return { error: message(error, "Codice non valido. Controlla di aver scritto l'ultimo che hai ricevuto.") };
  await markSignedIn();
  redirect(recovery ? "/accedi/nuova-password" : safeNext(field(form, "next")));
}

/** Password reset: always answers the same way, whether or not the address has an account. */
export async function requestPasswordReset(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = field(form, "email").toLowerCase();
  if (!isEmail(email)) return { error: "Scrivi un indirizzo email valido.", email };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NOT_CONFIGURED, email };
  if (!(await allowed("reset", email, 3, 10))) return { error: TOO_MANY, email };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent("/accedi/nuova-password")}`,
  });
  if (error) return { error: message(error, "Non siamo riusciti a mandare l'email. Riprova tra qualche minuto."), email };
  redirect(checkEmailUrl(email, { tipo: "recupero" }));
}

/** Sets a new password for the signed-in person (after a reset link, or from the profile). */
export async function updatePassword(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Le due password non coincidono." };
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NOT_CONFIGURED };

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { error: "Il link è scaduto. Richiedine uno nuovo da “Password dimenticata”." };
  if (!(await allowed("nuova-password", data.claims.sub, 5, 20))) return { error: TOO_MANY };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: message(error, "Non siamo riusciti a salvare la password. Riprova tra qualche minuto.") };
  return { done: true };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase?.auth.signOut();
  await clearSignedIn();
  redirect("/accedi?uscito=1");
}
