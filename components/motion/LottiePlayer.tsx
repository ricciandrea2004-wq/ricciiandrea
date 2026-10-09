"use client";

import { LottieLight, type LottieHandle } from "lottie-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "./shared";

// The part of LottieAnimation that carries the engine; it is only downloaded when needed.
export default function LottiePlayer({
  src,
  play,
  delay,
  onPlay,
  onError,
}: {
  src: string;
  play: boolean;
  delay: number;
  onPlay?: () => void;
  onError?: () => void;
}) {
  const handle = useRef<LottieHandle>(null);
  const [ready, setReady] = useState(false);
  const failed = useRef(onError);
  failed.current = onError;
  const subscriptions = useMemo(
    () => ({ ready: () => setReady(true), error: () => failed.current?.() }),
    [],
  );

  useEffect(() => {
    const h = handle.current;
    if (!ready || !h) return;
    // With reduced motion the drawing is shown finished, without movement.
    if (prefersReducedMotion()) {
      h.seek({ percent: 100 });
      return;
    }
    if (!play) return;
    const t = setTimeout(() => {
      onPlay?.();
      h.play();
    }, delay);
    return () => clearTimeout(t);
    // onPlay is left out on purpose: a new callback must not restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, play, delay]);

  return (
    <LottieLight
      src={src}
      loop={false}
      autoplay={false}
      lottieRef={handle}
      subscriptions={subscriptions}
      className="lottie__player"
    />
  );
}
