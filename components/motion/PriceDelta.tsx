"use client";

import { animate } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../Icon";
import { countableChange } from "./numbers";
import { dur, easeOut, prefersReducedMotion, useIsomorphicLayoutEffect, type MotionPhase } from "./shared";

// The "before → after" block of a signal. When it comes into view the old value is
// struck through and the new one counts to its value, so the change reads as a change.
//
// `play` lets a parent decide when it starts; without it, the block starts by itself
// when half of it is visible.
export default function PriceDelta({
  before,
  after,
  play,
  delay = 0,
  onDone,
  style,
}: {
  before: string;
  after: string;
  play?: boolean;
  delay?: number;
  onDone?: () => void;
  style?: React.CSSProperties;
}) {
  const root = useRef<HTMLDivElement>(null);
  const strike = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<MotionPhase>("pending");
  const [shown, setShown] = useState(after);
  const [seen, setSeen] = useState(false);
  const change = useMemo(() => countableChange(before, after), [before, after]);
  const done = useRef(onDone);
  done.current = onDone;

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) {
      setPhase("done");
      done.current?.();
      return;
    }
    if (change) setShown(change.write(change.from));
    setPhase("ready");
  }, [change]);

  useEffect(() => {
    if (play !== undefined || !root.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setSeen(true);
      },
      { threshold: 0.5 },
    );
    io.observe(root.current);
    return () => io.disconnect();
  }, [play]);

  const go = play ?? seen;

  const started = useRef(false);
  useEffect(() => {
    if (phase !== "ready" || !go || started.current) return;
    started.current = true;
    setPhase("playing");
    const controls = [
      strike.current &&
        animate(strike.current, { scaleX: [0, 1] }, { duration: dur.slow, ease: easeOut, delay: delay / 1000 }),
      change
        ? animate(change.from, change.to, {
            duration: 0.7,
            ease: easeOut,
            delay: delay / 1000 + 0.12,
            onUpdate: (v) => setShown(change.write(v)),
          })
        : null,
    ].filter((c) => !!c);
    Promise.all(controls.map((c) => c.finished)).then(() => {
      setShown(after);
      setPhase("done");
      done.current?.();
    });
  }, [phase, go, change, delay, after]);

  return (
    <div ref={root} className="delta" data-motion={phase} style={style}>
      <div className="delta__cell">
        <div className="xs muted">Prima</div>
        <div className="delta__value delta__value--before">
          <span className="delta__struck">
            {before}
            <span ref={strike} className="delta__strike" aria-hidden="true" />
          </span>
        </div>
      </div>
      <Icon name="arrowRight" className="icon delta__arrow" />
      <div className="delta__cell delta__cell--after">
        <div className="xs muted">Dopo</div>
        <div className="delta__value">
          <span aria-hidden={phase === "playing" || undefined}>{shown}</span>
          {phase === "playing" && <span className="visually-hidden">{after}</span>}
        </div>
      </div>
    </div>
  );
}
