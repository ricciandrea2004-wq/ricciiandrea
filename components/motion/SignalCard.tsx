"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import Tag from "../Tag";
import MotionProvider from "./MotionProvider";
import PriceDelta from "./PriceDelta";
import { dur, easeIn, easeOut, prefersReducedMotion, useIsomorphicLayoutEffect, type MotionPhase } from "./shared";

type Status = { label: string; color: "green" | "yellow" | "blue" };

// The example signal on the public pages. When it comes into view it tells the
// product in one breath: the value changes, then the signal turns from
// "Da verificare" to "Verificato" (when `startStatus` is given).
export default function SignalCard({
  kind,
  title,
  before,
  after,
  source,
  observed,
  status,
  startStatus,
  className = "",
}: {
  kind: string;
  title: string;
  before: string;
  after: string;
  source: string;
  observed: string;
  status: Status;
  startStatus?: Status;
  className?: string;
}) {
  const card = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<MotionPhase>(startStatus ? "pending" : "done");
  const [shownStatus, setShownStatus] = useState(status);
  const [seen, setSeen] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (!startStatus) return;
    if (prefersReducedMotion()) return setPhase("done");
    setShownStatus(startStatus);
    setPhase("ready");
  }, [startStatus]);

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

  function onDeltaDone() {
    if (!startStatus || prefersReducedMotion()) return;
    setPhase("playing");
    setTimeout(() => {
      setShownStatus(status);
      setPhase("done");
    }, 260);
  }

  return (
    <MotionProvider>
      <figure ref={card} className={`signal-card ${className}`} data-motion={phase} style={{ margin: 0 }}>
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
        <p className="eyebrow">{kind}</p>
        <h3>{title}</h3>
        <PriceDelta before={before} after={after} play={seen} delay={350} onDone={onDeltaDone} />
        <figcaption className="signal-card__meta">
          <span>
            <strong>Fonte:</strong> {source}
          </span>
          <span>
            <strong>Osservato:</strong> {observed}
          </span>
        </figcaption>
      </figure>
    </MotionProvider>
  );
}
