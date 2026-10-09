"use client";

import type { FormEvent } from "react";
import { useShell } from "./WorkspaceShell";

export default function SettingsForm({ children, submitLabel = "Salva" }: { children: React.ReactNode; submitLabel?: string }) {
  const { toast } = useShell();
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    toast("Il salvataggio si attiva quando colleghiamo il database. Nessuna modifica è stata salvata.");
  }
  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 20 }}>
      {children}
      <div>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
