"use client";

import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("./motion-features").then((m) => m.default);

// Wraps the parts of the site that use motion components (not the whole site, so pages
// without animations do not download it). Animations follow the system setting: with reduced motion, motion skips movement and keeps opacity.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
