"use client";

import { useMemo, useState } from "react";
import { TrafficMap } from "@/components/TrafficMap";
import { accidentWeekdayHistogram, monthlyAccidentHistogram } from "@/lib/metrics";
import type { MapPayload } from "@/lib/map-data";
import { useI18n } from "@/lib/i18n";
import { SparkBars } from "./SparkBars";

type Props = {
  payload: MapPayload;
};

export function SicurezzaClient({ payload }: Props) {
  const { t } = useI18n();
  const accidents = payload.accidents ?? [];
  const [weather, setWeather] = useState("tutti");
  const [roadType, setRoadType] = useState("tutti");
  const [pavement, setPavement] = useState<"all" | "wet" | "dry">("all");
  const [propertyDamage, setPropertyDamage] = useState<"all" | "yes" | "no">("all");
  const [year, setYear] = useState("tutti");

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const a of accidents) {
      const y = (a.date || "").slice(0, 4);
      if (y) set.add(y);
    }
    return ["tutti", ...[...set].sort()];
  }, [accidents]);

  const weathers = useMemo(() => {
    const set = new Set<string>();
    for (const a of accidents) {
      if (a.weather) set.add(a.weather);
    }
    return ["tutti", ...[...set].sort((a, b) => a.localeCompare(b, "it"))];
  }, [accidents]);

  const roadTypes = useMemo(() => {
    const set = new Set<string>();
    for (const a of accidents) {
      if (a.roadType) set.add(a.roadType);
    }
    return ["tutti", ...[...set].sort((a, b) => a.localeCompare(b, "it"))];
  }, [accidents]);

  const filtered = useMemo(() => {
    return accidents.filter((a) => {
      if (year !== "tutti" && !a.date.startsWith(year)) return false;
      if (weather !== "tutti" && !a.weather.toLowerCase().includes(weather.toLowerCase())) {
        return false;
      }
      if (roadType !== "tutti" && a.roadType !== roadType) return false;
      if (pavement === "wet" && !/bagnato|umid|brina|viscido/i.test(a.pavementState || "")) {
        return false;
      }
      if (pavement === "dry" && !/asciutto/i.test(a.pavementState || "")) return false;
      if (propertyDamage === "yes" && !a.propertyDamage) return false;
      if (propertyDamage === "no" && a.propertyDamage) return false;
      return true;
    });
  }, [accidents, weather, roadType, pavement, propertyDamage, year]);

  const monthly = useMemo(() => monthlyAccidentHistogram(filtered), [filtered]);
  const weekdays = useMemo(() => accidentWeekdayHistogram(filtered), [filtered]);
  const topWeekday = [...weekdays].sort((a, b) => b.count - a.count)[0];

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (roadType !== "tutti") params.set("roadType", roadType);
    if (pavement !== "all") params.set("pavement", pavement);
    if (weather !== "tutti") params.set("weather", weather);
    if (propertyDamage === "yes") params.set("propertyDamage", "1");
    if (propertyDamage === "no") params.set("propertyDamage", "0");
    if (year !== "tutti") params.set("year", year);
    const qs = params.toString();
    return `/api/export/accidents${qs ? `?${qs}` : ""}`;
  }, [roadType, pavement, weather, propertyDamage, year]);

  return (
    <>
      {years.length > 2 ? (
        <div className="chip-row" style={{ marginBottom: "0.75rem" }} role="group" aria-label="Anno">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className="chip"
              aria-pressed={year === y}
              onClick={() => setYear(y)}
            >
              {y === "tutti" ? "Tutti gli anni" : y}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ marginBottom: "0.75rem" }}>
          Dataset incidenti disponibile: {years.filter((y) => y !== "tutti").join(", ") || "n/d"}{" "}
          (nessun anno 2024 nel bundle attuale).
        </p>
      )}

      <div className="chip-row" style={{ marginBottom: "0.75rem" }} role="group" aria-label="Filtro meteo">
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

      <div className="chip-row" style={{ marginBottom: "0.75rem" }} role="group" aria-label="Tipo di strada">
        {roadTypes.slice(0, 8).map((r) => (
          <button
            key={r}
            type="button"
            className="chip"
            aria-pressed={roadType === r}
            onClick={() => setRoadType(r)}
          >
            {r === "tutti" ? "Strada: tutte" : r}
          </button>
        ))}
      </div>

      <div className="chip-row" style={{ marginBottom: "0.75rem" }} role="group" aria-label="Fondo stradale">
        {(
          [
            ["all", "Fondo: tutti"],
            ["dry", "Asciutto"],
            ["wet", "Bagnato / umido"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={pavement === value}
            onClick={() => setPavement(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chip-row" style={{ marginBottom: "0.75rem" }} role="group" aria-label="Danni a cose">
        {(
          [
            ["all", "Danni cose: tutti"],
            ["yes", "Con danni a cose"],
            ["no", "Senza danni a cose"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="chip"
            aria-pressed={propertyDamage === value}
            onClick={() => setPropertyDamage(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="muted" style={{ marginBottom: "1rem" }}>
        Filtri attivi: {filtered.length.toLocaleString("it-IT")} incidenti ·{" "}
        <a className="btn btn--ghost-dark" href={exportUrl} style={{ padding: "0.35rem 0.8rem" }}>
          {t("export_csv")}
        </a>
      </p>

      <div className="safety-charts" style={{ marginBottom: "1.25rem" }}>
        <div className="panel">
          <h2 style={{ fontSize: "1.2rem" }}>Istogramma mensile</h2>
          {monthly.length === 0 ? (
            <p className="muted empty-inline">Nessun incidente con i filtri correnti.</p>
          ) : (
            <SparkBars
              series={monthly.map((m) => ({ date: m.month, value: m.count }))}
              maxBars={24}
            />
          )}
        </div>
        <div className="panel">
          <h2 style={{ fontSize: "1.2rem" }}>Giorni più critici</h2>
          <p className="muted">
            I dataset open non espongono l’ora dell’incidente: mostriamo la distribuzione per
            giorno della settimana.
            {topWeekday ? (
              <>
                {" "}
                Picco: <strong>{topWeekday.label}</strong> ({topWeekday.count}).
              </>
            ) : null}
          </p>
          <div className="chart-bars" style={{ height: 100 }}>
            {weekdays.map((d) => {
              const max = Math.max(...weekdays.map((x) => x.count), 1);
              return (
                <span
                  key={d.weekday}
                  title={`${d.label}: ${d.count}`}
                  style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                />
              );
            })}
          </div>
          <div className="weekday-labels">
            {weekdays.map((d) => (
              <span key={d.weekday}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>

      <TrafficMap
        payload={payload}
        initialShowAccidents
        accidentFilter={{
          weather,
          roadType,
          pavement,
          propertyDamage,
          year: year === "tutti" ? undefined : year,
        }}
      />
    </>
  );
}
