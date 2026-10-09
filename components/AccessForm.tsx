"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "done" | "error";

const GENERIC_ERROR = "Qualcosa è andato storto. Riprova tra poco.";

// Posts to /api/access-request, the endpoint built by the Supabase + Resend thread.
export default function AccessForm({ redirectTo, size = "lg" }: { redirectTo?: string; size?: "md" | "lg" }) {
  const router = useRouter();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? GENERIC_ERROR);
      form.reset();
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      setStatus("done");
      setMessage("Richiesta ricevuta. Ti abbiamo scritto una email di conferma.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : GENERIC_ERROR);
    }
  }

  const sending = status === "sending";
  const btn = size === "lg" ? "btn btn-primary btn-lg" : "btn btn-primary";
  const input = size === "lg" ? "input input-lg" : "input";

  return (
    <div>
      <form className="access-form" onSubmit={onSubmit}>
        <label htmlFor={`${id}-email`} className="visually-hidden">
          Email di lavoro
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nome@azienda.it"
          className={input}
          required
          disabled={sending}
        />
        <button type="submit" className={btn} disabled={sending}>
          {sending ? "Invio in corso…" : "Richiedi accesso"}
        </button>
      </form>
      <p className="form-status" data-state={status} role="status" aria-live="polite" style={{ marginTop: 8 }}>
        {message}
      </p>
    </div>
  );
}
