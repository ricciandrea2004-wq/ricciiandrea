"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { easeOut, prefersReducedMotion, useIsomorphicLayoutEffect, type MotionPhase } from "./shared";

// A whole number that counts up from zero the first time it appears.
export default function CountUp({
  value,
  delay = 0,
  className = "",
}: {
  value: number;
  delay?: number;
  className?: string;
}) {
  const [phase, setPhase] = useState<MotionPhase>("pending");
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion() || value === 0) return setPhase("done");
    setShown(0);
    setPhase("ready");
  }, [value]);

  useEffect(() => {
    if (phase !== "ready" || started.current) return;
    started.current = true;
    animate(0, value, {
      duration: 0.6,
      ease: easeOut,
      delay: delay / 1000,
      onUpdate: (v) => setShown(Math.round(v)),
    }).finished.then(() => setPhase("done"));
  }, [phase, value, delay]);

  return (
    <span className={`count ${className}`} data-motion={phase}>
      <span aria-hidden={phase !== "done" || undefined}>{shown}</span>
      {phase !== "done" && <span className="visually-hidden">{value}</span>}
    </span>
  );
}
