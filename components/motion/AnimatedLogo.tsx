"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";
import { prefersReducedMotion, useIsomorphicLayoutEffect, type MotionPhase } from "./shared";

type Player = typeof import("./LottiePlayer").default;

// The logo, drawn by public/lottie/logo.json the first time it is seen: the "c." symbol,
// then the letters, then the two blue dots land and settle (1.2 s, once).
// The static logo stays underneath and keeps the size; it is what shows without
// JavaScript, with reduced motion, and on client-side navigations, where the header
// has already been seen.
export default function AnimatedLogo({ trigger }: { trigger: "load" | "view" }) {
  const box = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<MotionPhase>("pending");
  const [Player, setPlayer] = useState<Player | null>(null);
  const [visible, setVisible] = useState(false);

  useIsomorphicLayoutEffect(() => {
    // On load the header plays only in the first moments of the page, never after
    // a client-side navigation.
    const late = trigger === "load" && performance.now() > 1500;
    if (prefersReducedMotion() || late) setPhase("done");
  }, [trigger]);

  useEffect(() => {
    const el = box.current;
    if (!el || phase !== "pending") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        setVisible(true);
        import("./LottiePlayer")
          .then((m) => setPlayer(() => m.default))
          .catch(() => setPhase("done"));
      },
      { threshold: trigger === "view" ? 0.5 : 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, trigger]);

  return (
    <span ref={box} className="logo-anim" data-motion={phase}>
      <LogoMark />
      <Wordmark />
      {Player && phase !== "done" && (
        <span className="logo-anim__lottie lottie" aria-hidden="true">
          <Player
            src="/lottie/logo.json"
            play={visible}
            delay={0}
            onPlay={() => setPhase("playing")}
            onError={() => setPhase("done")}
          />
        </span>
      )}
    </span>
  );
}
