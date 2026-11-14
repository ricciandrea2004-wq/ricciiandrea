"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export function CopyButton({
  text,
  label,
  className = "btn btn--ghost-dark copy-btn",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button type="button" className={className} onClick={() => void onCopy()}>
      {done ? t("copied") : label ?? t("copy")}
    </button>
  );
}
