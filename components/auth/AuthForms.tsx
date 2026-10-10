"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  requestPasswordReset,
  sendLoginLink,
  signInWithPassword,
  updatePassword,
  verifyEmailCode,
  type AuthFormState,
} from "@/lib/auth/actions";

function Status({ state }: { state: AuthFormState }) {
  return (
    <p className="form-status" role="status" aria-live="polite" data-state={state.error ? "error" : state.done ? "done" : undefined}>
      {state.error}
    </p>
  );
}

function EmailField({ defaultEmail = "", autoFocus = false }: { defaultEmail?: string; autoFocus?: boolean }) {
  return (
    <div className="field">
      <label className="label" htmlFor="auth-email">
        Email di lavoro
      </label>
      <input
        id="auth-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        autoFocus={autoFocus}
        defaultValue={defaultEmail}
        placeholder="nome@azienda.it"
        className="input input-lg"
      />
    </div>
  );
}

/** Sign-in link by email: the default way in, also used on the invitation page. */
export function MagicLinkForm({ submitLabel = "Continua con l'email", defaultEmail = "", next = "/app" }: { submitLabel?: string; defaultEmail?: string; next?: string }) {
  const [state, action, pending] = useActionState(sendLoginLink, {});
  return (
    <form className="stack" action={action}>
      <input type="hidden" name="next" value={next} />
      <EmailField defaultEmail={defaultEmail} />
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Invio in corso…" : submitLabel}
      </button>
      <Status state={state} />
    </form>
  );
}

function PasswordForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, {});
  return (
    <form className="stack" action={action}>
      <input type="hidden" name="next" value={next} />
      <EmailField autoFocus />
      <div className="field">
        <div className="field__row">
          <label className="label" htmlFor="auth-password">
            Password
          </label>
          <Link href="/accedi/password-dimenticata" className="link small">
            Password dimenticata?
          </Link>
        </div>
        <input id="auth-password" name="password" type="password" autoComplete="current-password" required className="input input-lg" />
      </div>
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Accesso in corso…" : "Entra"}
      </button>
      <Status state={state} />
    </form>
  );
}

/** The login page: link via email first, password for those who have set one. */
export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"link" | "password">("link");
  return (
    <div className="stack">
      {mode === "link" ? <MagicLinkForm next={next} /> : <PasswordForm next={next} />}
      <button type="button" className="link-btn small" onClick={() => setMode(mode === "link" ? "password" : "link")}>
        {mode === "link" ? "Entra con la password" : "Ricevi invece un link via email"}
      </button>
    </div>
  );
}

/** The 6-digit code printed in the email, for when the link opens on another device. */
export function CodeForm({ email, recovery, next }: { email: string; recovery: boolean; next?: string }) {
  const [state, action, pending] = useActionState(verifyEmailCode, {});
  return (
    <form className="stack" action={action} style={{ textAlign: "left" }}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="tipo" value={recovery ? "recupero" : "accesso"} />
      {next && <input type="hidden" name="next" value={next} />}
      <div className="field">
        <label className="label" htmlFor="auth-code">
          Oppure scrivi il codice dell&apos;email
        </label>
        <input
          id="auth-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          placeholder="123456"
          className="input input-lg input-code"
        />
      </div>
      <button type="submit" className="btn btn-secondary btn-lg" disabled={pending}>
        {pending ? "Verifica in corso…" : recovery ? "Continua" : "Entra con il codice"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  return (
    <form className="stack" action={action}>
      <EmailField autoFocus />
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Invio in corso…" : "Mandami il link"}
      </button>
      <Status state={state} />
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  if (state.done) {
    return (
      <div className="stack">
        <p className="form-status" role="status" data-state="done">
          Password salvata. Da ora puoi entrare anche con email e password.
        </p>
        <Link href="/app" className="btn btn-primary btn-lg">
          Vai al workspace
        </Link>
      </div>
    );
  }
  return (
    <form className="stack" action={action}>
      <div className="field">
        <label className="label" htmlFor="new-password">
          Nuova password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
          aria-describedby="new-password-hint"
          className="input input-lg"
        />
        <span className="hint" id="new-password-hint">
          Almeno 8 caratteri.
        </span>
      </div>
      <div className="field">
        <label className="label" htmlFor="new-password-confirm">
          Ripeti la password
        </label>
        <input id="new-password-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="input input-lg" />
      </div>
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Salvataggio…" : "Salva la password"}
      </button>
      <Status state={state} />
    </form>
  );
}
