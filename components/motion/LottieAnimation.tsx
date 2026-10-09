"use client";

import { useEffect, useRef, useState } from "react";

// Files in public/lottie/, built by scripts/lottie/build.mjs.
export type LottieName =
  | "fonte"
  | "verifica"
  | "briefing"
  | "richiesta"
  | "email"
  | "bussola"
  | "nessun-risultato"
  | "avviso";

type Player = typeof import("./LottiePlayer").default;

// A decorative Lottie animation that plays once when it comes into view.
// The box keeps its size from the start, so nothing moves when the drawing arrives,
// and the engine is fetched only when the box is about to scroll into view.
export default function LottieAnimation({
  name,
  width,
  height,
  delay = 0,
  className = "",
}: {
  name: LottieName;
  width: number;
  height: number;
  delay?: number;
  className?: string;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [Player, setPlayer] = useState<Player | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        import("./LottiePlayer").then((m) => setPlayer(() => m.default));
      },
      { rootMargin: "200px" },
    );
    const seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        seen.disconnect();
        setVisible(true);
      },
      { threshold: 0.5 },
    );
    near.observe(el);
    seen.observe(el);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, []);

  return (
    <span ref={box} className={`lottie ${className}`} style={{ width, height }} aria-hidden="true">
      {Player && <Player src={`/lottie/${name}.json`} play={visible} delay={delay} />}
    </span>
  );
}
