"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

// Supabase Auth is not wired yet: the form validates the email and says so, instead of pretending to send a link.
export default function MagicLinkForm({ submitLabel = "Continua con l'email", defaultEmail = "" }: { submitLabel?: string; defaultEmail?: string }) {
  const [notice, setNotice] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(true);
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate={false}>
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
          defaultValue={defaultEmail}
          placeholder="nome@azienda.it"
          className="input input-lg"
        />
      </div>
      <button type="submit" className="btn btn-primary btn-lg">
        {submitLabel}
      </button>
      <p className="form-status" role="status" aria-live="polite">
        {notice && (
          <>
            L&apos;accesso con link via email non è ancora attivo. Intanto puoi{" "}
            <Link href="/app" className="link">
              esplorare il workspace con dati di esempio
            </Link>
            .
          </>
        )}
      </p>
    </form>
  );
}
