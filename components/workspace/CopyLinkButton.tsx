"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { dur, easeOut } from "../motion/shared";
import { useShell } from "./WorkspaceShell";

export default function CopyLinkButton() {
  const { toast } = useShell();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copiato.");
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Non riesco a copiare: copia l'indirizzo dalla barra del browser.");
    }
  }
  return (
    <button type="button" className="icon-btn" aria-label="Copia link" title="Copia link" onClick={copy}>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={copied ? "check" : "link"}
          className="icon-swap"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: dur.fast, ease: easeOut }}
        >
          <Icon name={copied ? "check" : "link"} />
        </m.span>
      </AnimatePresence>
    </button>
  );
}
