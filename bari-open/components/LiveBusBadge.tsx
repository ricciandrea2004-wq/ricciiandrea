"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export function LiveBusBadge() {
  const { t } = useI18n();
  const [count, setCount] = useState<number | null>(null);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/live/amtab");
        const json = (await res.json()) as { ok?: boolean; count?: number };
        if (cancelled) return;
        setOk(Boolean(json.ok));
        setCount(typeof json.count === "number" ? json.count : 0);
      } catch {
        if (!cancelled) {
          setOk(false);
          setCount(null);
        }
      }
    }
    void load();
    const id = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (count == null) {
    return (
      <span className="live-badge live-badge--loading" aria-live="polite">
        …
      </span>
    );
  }

  return (
    <span
      className={`live-badge${ok ? "" : " live-badge--down"}`}
      title="AMTAB GTFS-RT"
      aria-live="polite"
    >
      <span className="live-badge__dot" aria-hidden="true" />
      {ok ? `${count} ${t("live_buses")}` : "live n/d"}
    </span>
  );
}
