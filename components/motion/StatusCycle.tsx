"use client";

import { useEffect, useRef, useState } from "react";
import { StatusTag } from "../SignalTags";
import { statusColor, type SignalStatus } from "@/lib/domain";
import { prefersReducedMotion, useLoopActive } from "./shared";

// How long each status stays lit.
const STEP_MS = 2600;

// The list of the four signal statuses on /prodotto/segnali. While it is on screen the
// rows light up one after the other in their own status colour, the order a signal
// goes through. It stands still when the page is hidden, under the pointer, or with
// reduced motion.
export default function StatusCycle({ items }: { items: { status: SignalStatus; text: string }[] }) {
  const list = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const active = useLoopActive(list, 0.6);

  useEffect(() => {
    if (!active || held || prefersReducedMotion()) return;
    setCurrent((c) => c ?? 0);
    const t = setInterval(() => setCurrent((c) => ((c ?? -1) + 1) % items.length), STEP_MS);
    return () => clearInterval(t);
  }, [active, held, items.length]);

  return (
    <ul
      ref={list}
      className="list status-cycle reveal"
      style={{ maxWidth: 760 }}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
    >
      {items.map((item, i) => (
        <li
          key={item.status}
          data-current={i === current || undefined}
          style={{ "--row": `var(--tag-${statusColor[item.status]})` } as React.CSSProperties}
        >
          <div className="list__item">
            <span style={{ width: 120, flex: "none" }}>
              <StatusTag status={item.status} />
            </span>
            <span className="list__main">{item.text}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
