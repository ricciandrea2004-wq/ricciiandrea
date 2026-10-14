"use client";

import { useEffect, useRef, useState } from "react";

// The launch video as part of the page, like an SVG: it starts on its own, muted and looped,
// with no controls and nothing to click, focus or pause. With reduced motion, or when the
// browser refuses to play it, a still frame takes its place.
export default function LaunchVideo({ className = "" }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    // A browser that cannot decode the file reports it on the source, not through play(),
    // and may have done so before this runs: canPlayType covers that case.
    const source = el.querySelector("source");
    if (!el.canPlayType("video/mp4")) {
      setStill(true);
      return;
    }
    const fail = () => setStill(true);
    source?.addEventListener("error", fail);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (reduce.matches) {
        el.pause();
        setStill(true);
        return;
      }
      setStill(false);
      // React sets muted only as a property, so autoplay is started here rather than by the HTML.
      el.muted = true;
      el.play().catch(() => setStill(true));
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => {
      reduce.removeEventListener("change", sync);
      source?.removeEventListener("error", fail);
    };
  }, []);

  return (
    <div
      className={`launch-video ${className}`}
      data-still={still || undefined}
      role="img"
      aria-label="Animazione: il prezzo del piano Pro di un competitor scende da 52 a 48 euro, diventa un segnale con la sua fonte, viene verificato ed entra nel briefing."
    >
      <video
        ref={video}
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        aria-hidden="true"
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src="/video/competia-lancio.mp4" type="video/mp4" />
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/video/competia-lancio.jpg" alt="" width={960} height={960} className="launch-video__still" />
    </div>
  );
}
