"use client";

import Icon from "../Icon";
import { useShell } from "./WorkspaceShell";

export default function CopyLinkButton() {
  const { toast } = useShell();
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copiato.");
    } catch {
      toast("Non riesco a copiare: copia l'indirizzo dalla barra del browser.");
    }
  }
  return (
    <button type="button" className="icon-btn" aria-label="Copia link" title="Copia link" onClick={copy}>
      <Icon name="link" />
    </button>
  );
}
