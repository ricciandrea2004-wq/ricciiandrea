"use client";

import { useMemo, useState } from "react";
import { TrafficMap } from "@/components/TrafficMap";
import type { MapPayload } from "@/lib/map-data";

type Props = {
  payload: MapPayload;
};

export function SicurezzaClient({ payload }: Props) {
  const accidents = payload.accidents ?? [];
  const [injuriesOnly, setInjuriesOnly] = useState(false);
  const [weather, setWeather] = useState("tutti");

  const weathers = useMemo(() => {
    const set = new Set<string>();
    for (const a of accidents) {
      if (a.weather) set.add(a.weather);
    }
    return ["tutti", ...[...set].sort((a, b) => a.localeCompare(b, "it"))];
  }, [accidents]);

  const filteredCount = useMemo(() => {
    return accidents.filter((a) => {
      if (injuriesOnly && !a.injuries) return false;
      if (weather !== "tutti" && !a.weather.toLowerCase().includes(weather.toLowerCase())) {
        return false;
      }
      return true;
    }).length;
  }, [accidents, injuriesOnly, weather]);

  return (
    <>
      <div className="chip-row" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="chip"
          aria-pressed={!injuriesOnly}
          onClick={() => setInjuriesOnly(false)}
        >
          Tutti ({accidents.length})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={injuriesOnly}
          onClick={() => setInjuriesOnly(true)}
        >
          Solo con lesioni
        </button>
        {weathers.slice(0, 8).map((w) => (
          <button
            key={w}
            type="button"
            className="chip"
            aria-pressed={weather === w}
            onClick={() => setWeather(w)}
          >
            {w === "tutti" ? "Meteo: tutti" : w}
          </button>
        ))}
      </div>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        In overlay: {filteredCount.toLocaleString("it-IT")} incidenti
      </p>
      <TrafficMap
        payload={payload}
        showAccidents
        accidentFilter={{ injuriesOnly, weather }}
      />
    </>
  );
}
