"use client";

import { useMemo, useState } from "react";
import { TrafficMap } from "@/components/TrafficMap";
import type { MapPayload } from "@/lib/map-data";

type Props = {
  payload: MapPayload;
};

export function SicurezzaClient({ payload }: Props) {
  const accidents = payload.accidents ?? [];
  const [weather, setWeather] = useState("tutti");

  const weathers = useMemo(() => {
    const set = new Set<string>();
    for (const a of accidents) {
      if (a.weather) set.add(a.weather);
    }
    return ["tutti", ...[...set].sort((a, b) => a.localeCompare(b, "it"))];
  }, [accidents]);

  const weatherCount = useMemo(() => {
    if (weather === "tutti") return accidents.length;
    return accidents.filter((a) =>
      a.weather.toLowerCase().includes(weather.toLowerCase()),
    ).length;
  }, [accidents, weather]);

  return (
    <>
      <div className="chip-row" style={{ marginBottom: "1rem" }} role="group" aria-label="Filtro meteo">
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
        Filtro meteo: {weatherCount.toLocaleString("it-IT")} incidenti
      </p>
      <TrafficMap
        payload={payload}
        initialShowAccidents
        accidentFilter={{ weather }}
      />
    </>
  );
}
