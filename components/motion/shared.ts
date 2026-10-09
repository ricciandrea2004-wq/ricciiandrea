import { useEffect, useLayoutEffect, useState } from "react";

// The design system's curves and durations (tokens.css), in the form motion takes.
export const easeOut = [0.2, 0, 0, 1] as const;
export const easeIn = [0.4, 0, 1, 1] as const;
export const dur = { instant: 0.08, fast: 0.14, base: 0.2, slow: 0.28 } as const;

export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Where an animated value stands. The server renders the final values with "pending"
// (hidden by CSS only while JavaScript is on its way); the client then shows the
// starting values ("ready"), plays them ("playing") and settles on the final ones ("done").
export type MotionPhase = "pending" | "ready" | "playing" | "done";

// True while the element is on screen and the page is visible. Loops run only then.
export function useLoopActive(ref: React.RefObject<Element | null>, threshold = 0.3) {
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return inView && pageVisible;
}
