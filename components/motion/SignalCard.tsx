"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { categoryColor, categoryLabel, type Category } from "@/lib/domain";
import Tag from "../Tag";
import MotionProvider from "./MotionProvider";
import PriceDelta from "./PriceDelta";
import {
  dur,
  easeIn,
  easeOut,
  prefersReducedMotion,
  useIsomorphicLayoutEffect,
  useLoopActive,
  type MotionPhase,
} from "./shared";

type Status = { label: string; color: "green" | "yellow" | "blue" };

export type SignalSample = {
  category?: Category;
  kind: string;
  title: string;
  before: string;
  after: string;
  source: string;
  observed: string;
  status: Status;
  startStatus?: Status;
};

// How long a finished example stays still before the next one comes in.
const HOLD_MS = 6000;

// The example signal on the public pages. When it comes into view it tells the
// product in one breath: the value changes, then the signal turns from
// "Da verificare" to "Verificato" (when `startStatus` is given).
//
// With more than one sample the card moves on to the next one after a pause, only
// while it is on screen, the page is visible and the pointer or focus is not on it.
// Picking a sample from the dots stops the rotation.
export default function SignalCard({ signals, className = "" }: { signals: SignalSample[]; className?: string }) {
  const card = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const signal = signals[index]!;
  const [phase, setPhase] = useState<MotionPhase>(signal.startStatus ? "pending" : "done");
  const [shownStatus, setShownStatus] = useState(signal.status);
  const [seen, setSeen] = useState(false);
  const [held, setHeld] = useState(false);
  const [picked, setPicked] = useState(false);
  const active = useLoopActive(card);
  // Bumped on every switch, so a status change still due for the previous sample is dropped.
  const run = useRef(0);

  useIsomorphicLayoutEffect(() => {
    const first = signals[0]!;
    if (!first.startStatus) return;
    if (prefersReducedMotion()) return setPhase("done");
    setShownStatus(first.startStatus);
    setPhase("ready");
  }, [signals]);

  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setSeen(true);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function show(next: number) {
    const s = signals[next]!;
    const animated = !!s.startStatus && !prefersReducedMotion();
    run.current += 1;
    setIndex(next);
    setShownStatus(animated ? s.startStatus! : s.status);
    setPhase(animated ? "ready" : "done");
  }

  useEffect(() => {
    if (signals.length < 2 || phase !== "done" || !active || held || picked || prefersReducedMotion()) return;
    const t = setTimeout(() => show((index + 1) % signals.length), HOLD_MS);
    return () => clearTimeout(t);
  }, [signals.length, phase, active, held, picked, index]);

  function onDeltaDone() {
    if (!signal.startStatus || prefersReducedMotion()) return;
    const at = run.current;
    setPhase("playing");
    setTimeout(() => {
      if (run.current !== at) return;
      setShownStatus(signal.status);
      setPhase("done");
    }, 260);
  }

  const color = signal.category ? categoryColor[signal.category] : null;

  return (
    <MotionProvider>
      <figure
        ref={card}
        className={`signal-card ${signals.length > 1 ? "signal-card--cycle" : ""} ${className}`}
        data-motion={phase}
        style={{ margin: 0 }}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
        }}
      >
        <div className="signal-card__top">
          <span className="xs muted">Esempio illustrativo</span>
          <span className="signal-card__status">
            {phase === "pending" ? (
              <Tag color={shownStatus.color}>{shownStatus.label}</Tag>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={shownStatus.label}
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: dur.base, ease: easeOut } }}
                  exit={{ opacity: 0, y: -4, transition: { duration: dur.fast, ease: easeIn } }}
                  style={{ display: "inline-flex" }}
                >
                  <Tag color={shownStatus.color}>{shownStatus.label}</Tag>
                </m.span>
              </AnimatePresence>
            )}
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: dur.slow, ease: easeOut } }}
            exit={{ opacity: 0, transition: { duration: dur.base, ease: easeIn } }}
          >
            <p className="eyebrow">
              {color && <span className="cat-dot" style={{ background: `var(--tag-${color})` }} aria-hidden="true" />}
              {signal.kind}
            </p>
            <h3>{signal.title}</h3>
            <PriceDelta
              before={signal.before}
              after={signal.after}
              play={seen}
              delay={index === 0 ? 350 : 200}
              onDone={onDeltaDone}
            />
            <figcaption className="signal-card__meta">
              <span>
                <strong>Fonte:</strong> {signal.source}
              </span>
              <span>
                <strong>Osservato:</strong> {signal.observed}
              </span>
            </figcaption>
          </m.div>
        </AnimatePresence>
        {signals.length > 1 && (
          <div className="signal-card__pager" role="group" aria-label="Esempi di segnale">
            {signals.map((s, i) => (
              <button
                key={s.kind}
                type="button"
                className="signal-card__dot"
                aria-pressed={i === index}
                aria-label={`Mostra l'esempio ${s.category ? categoryLabel[s.category] : s.kind}`}
                style={s.category ? ({ "--dot": `var(--tag-${categoryColor[s.category]})` } as React.CSSProperties) : undefined}
                onClick={() => {
                  setPicked(true);
                  if (i !== index) show(i);
                }}
              />
            ))}
          </div>
        )}
      </figure>
    </MotionProvider>
  );
}
