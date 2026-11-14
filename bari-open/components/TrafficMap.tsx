"use client";

import { useEffect, useMemo, useState } from "react";
import type { MapPayload } from "@/lib/map-data";

type Props = {
  payload: MapPayload;
  showAccidents?: boolean;
  accidentFilter?: {
    injuriesOnly?: boolean;
    weather?: string;
  };
};

export function TrafficMap({ payload, showAccidents = false, accidentFilter }: Props) {
  const { centraline, deviceFlows, accidents = [] } = payload;
  const [selectedId, setSelectedId] = useState<number | null>(centraline[0]?.device_id ?? null);
  const [ready, setReady] = useState(false);

  const byDevice = useMemo(() => {
    const map = new Map(deviceFlows.map((f) => [f.device_id, f]));
    return map;
  }, [deviceFlows]);

  const maxTotal = useMemo(() => {
    let m = 1;
    for (const v of deviceFlows) m = Math.max(m, v.total);
    return m;
  }, [deviceFlows]);

  const selected = centraline.find((c) => c.device_id === selectedId) ?? null;
  const selectedFlow = selected ? byDevice.get(selected.device_id) : undefined;

  const filteredAccidents = useMemo(() => {
    if (!showAccidents) return [];
    return accidents.filter((a) => {
      if (accidentFilter?.injuriesOnly && !a.injuries) return false;
      if (accidentFilter?.weather && accidentFilter.weather !== "tutti") {
        if (!a.weather.toLowerCase().includes(accidentFilter.weather.toLowerCase())) return false;
      }
      return true;
    });
  }, [accidents, showAccidents, accidentFilter]);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    async function mount() {
      const L = await import("leaflet");
      if (cancelled) return;

      const el = document.getElementById("vista-map");
      if (!el) return;

      map = L.map(el, {
        center: [41.12, 16.87],
        zoom: 12,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const c of centraline) {
        const total = byDevice.get(c.device_id)?.total ?? 0;
        const intensity = Math.max(0.25, total / maxTotal);
        const marker = L.circleMarker([c.latitude, c.longitude], {
          radius: 7 + intensity * 10,
          color: "#083f4c",
          weight: 1,
          fillColor: "#1a8a9e",
          fillOpacity: 0.35 + intensity * 0.55,
        });
        marker.bindTooltip(`${c.code} · ${c.name}`);
        marker.on("click", () => setSelectedId(c.device_id));
        marker.addTo(map);
      }

      for (const a of filteredAccidents) {
        L.circleMarker([a.latitude, a.longitude], {
          radius: a.injuries ? 5 : 3.5,
          color: a.injuries ? "#8a2f1d" : "#c45c3e",
          weight: 1,
          fillColor: a.injuries ? "#c45c3e" : "#d4b896",
          fillOpacity: 0.7,
        })
          .bindTooltip(
            `${a.date || "data n/d"} · ${a.roadType || "strada"} · ${
              a.injuries ? "con lesioni" : "senza lesioni"
            }`,
          )
          .addTo(map!);
      }

      setReady(true);
    }

    void mount();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [centraline, byDevice, maxTotal, filteredAccidents]);

  const recent = selectedFlow?.series.slice(-14) ?? [];
  const recentAvg =
    recent.length > 0 ? recent.reduce((s, p) => s + p.value, 0) / recent.length : 0;

  return (
    <div className="map-shell">
      <div className="map-frame" aria-busy={!ready}>
        <div id="vista-map" style={{ width: "100%", height: "100%", minHeight: "60vh" }} />
      </div>
      <aside className="side-panel panel">
        <p className="section__eyebrow">Centralina</p>
        <h2>{selected?.name ?? "Seleziona un punto"}</h2>
        {selected ? (
          <>
            <p className="muted">
              Codice {selected.code} · {selected.detectors.length} spire · device{" "}
              {selected.device_id}
            </p>
            <p>
              Flusso totale nel mese sincronizzato:{" "}
              <strong>{Math.round(selectedFlow?.total ?? 0).toLocaleString("it-IT")}</strong>{" "}
              passaggi
            </p>
            <p className="muted">
              Media ultimi {recent.length || "—"} giorni:{" "}
              {Math.round(recentAvg).toLocaleString("it-IT")} veicoli/giorno (somma spire)
            </p>
            <div className="chart-bars" style={{ height: 120 }}>
              {recent.map((p) => {
                const max = Math.max(...recent.map((x) => x.value), 1);
                return (
                  <span
                    key={p.date}
                    title={`${p.date}: ${p.value}`}
                    style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
                  />
                );
              })}
            </div>
            <ul className="muted" style={{ paddingLeft: "1.1rem", margin: 0 }}>
              {selected.detectors.slice(0, 6).map((d) => (
                <li key={d.detector_id}>
                  {d.detector_code}: {d.detector_description || "spira"}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">Clicca un marker sulla mappa.</p>
        )}
        {showAccidents ? (
          <p className="muted" style={{ marginTop: "auto" }}>
            Overlay incidenti: {filteredAccidents.length.toLocaleString("it-IT")} punti
          </p>
        ) : null}
      </aside>
    </div>
  );
}
