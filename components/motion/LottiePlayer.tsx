"use client";

import { LottieLight, type LottieHandle } from "lottie-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "./shared";

// The part of LottieAnimation that carries the engine; it is only downloaded when needed.
export default function LottiePlayer({ src, play, delay }: { src: string; play: boolean; delay: number }) {
  const handle = useRef<LottieHandle>(null);
  const [ready, setReady] = useState(false);
  const subscriptions = useMemo(() => ({ ready: () => setReady(true) }), []);

  useEffect(() => {
    const h = handle.current;
    if (!ready || !h) return;
    // With reduced motion the drawing is shown finished, without movement.
    if (prefersReducedMotion()) {
      h.seek({ percent: 100 });
      return;
    }
    if (!play) return;
    const t = setTimeout(() => h.play(), delay);
    return () => clearTimeout(t);
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
