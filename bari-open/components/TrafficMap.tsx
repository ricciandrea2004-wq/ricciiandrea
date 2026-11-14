"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deviceKey } from "@/lib/device-key";
import type { MapAccident, MapDistricts, MapPayload } from "@/lib/map-data";

const EMPTY_ACCIDENTS: MapAccident[] = [];
const ACCIDENT_MARKER_CAP = 800;

type AccidentCluster = {
  latitude: number;
  longitude: number;
  count: number;
  injuries: number;
  sample: MapAccident;
};

/** Grid-cluster accidents (~0.001° cells), then keep the densest/recent up to cap. */
function clusterAccidents(
  accidents: MapAccident[],
  cap = ACCIDENT_MARKER_CAP,
): AccidentCluster[] {
  const cells = new Map<string, AccidentCluster>();
  for (const a of accidents) {
    const lat = Math.round(a.latitude * 1000) / 1000;
    const lon = Math.round(a.longitude * 1000) / 1000;
    const key = `${lat}:${lon}`;
    const prev = cells.get(key);
    if (prev) {
      prev.count += 1;
      if (a.injuries) prev.injuries += 1;
      if ((a.date || "") > (prev.sample.date || "")) prev.sample = a;
    } else {
      cells.set(key, {
        latitude: lat,
        longitude: lon,
        count: 1,
        injuries: a.injuries ? 1 : 0,
        sample: a,
      });
    }
  }
  let list = [...cells.values()];
  if (list.length > cap) {
    list.sort(
      (a, b) =>
        b.count - a.count ||
        (b.sample.date || "").localeCompare(a.sample.date || ""),
    );
    list = list.slice(0, cap);
  }
  return list;
}

function resolveInitialKey(
  centraline: MapPayload["centraline"],
  initialSelectedKey: string | null | undefined,
): string | null {
  if (
    initialSelectedKey &&
    centraline.some((c) => deviceKey(c) === initialSelectedKey)
  ) {
    return initialSelectedKey;
  }
  return centraline[0] ? deviceKey(centraline[0]) : null;
}

type Props = {
  payload: MapPayload;
  /** Composite device key (`device_db:device_type:device_id`) from `?c=`. */
  initialSelectedKey?: string | null;
  /** Accidents overlay: off on /mappa, on on /sicurezza. */
  initialShowAccidents?: boolean;
  accidentFilter?: {
    injuriesOnly?: boolean;
    weather?: string;
  };
  /** Optional GeoJSON outlines; also read from `payload.districts`. */
  districts?: MapDistricts;
};

export function TrafficMap({
  payload,
  initialSelectedKey = null,
  initialShowAccidents = false,
  accidentFilter,
  districts: districtsProp,
}: Props) {
  const { centraline, deviceFlows } = payload;
  const accidents = payload.accidents ?? EMPTY_ACCIDENTS;
  const districts = districtsProp ?? payload.districts;

  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    resolveInitialKey(centraline, initialSelectedKey),
  );
  const [showCentraline, setShowCentraline] = useState(true);
  const [showAccidents, setShowAccidents] = useState(initialShowAccidents);
  const [injuriesOnly, setInjuriesOnly] = useState(
    () => accidentFilter?.injuriesOnly ?? false,
  );
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const didFlyToDeepLink = useRef(false);

  const byDevice = useMemo(() => {
    return new Map(deviceFlows.map((f) => [f.key, f]));
  }, [deviceFlows]);

  const maxTotal = useMemo(() => {
    let m = 1;
    for (const v of deviceFlows) m = Math.max(m, v.total);
    return m;
  }, [deviceFlows]);

  const selected = centraline.find((c) => deviceKey(c) === selectedKey) ?? null;
  const selectedFlow = selected ? byDevice.get(deviceKey(selected)) : undefined;

  const filteredAccidents = useMemo(() => {
    if (!showAccidents) return EMPTY_ACCIDENTS;
    const wantInjuries = injuriesOnly || Boolean(accidentFilter?.injuriesOnly);
    return accidents.filter((a) => {
      if (wantInjuries && !a.injuries) return false;
      if (accidentFilter?.weather && accidentFilter.weather !== "tutti") {
        if (!a.weather.toLowerCase().includes(accidentFilter.weather.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [accidents, showAccidents, injuriesOnly, accidentFilter]);

  const accidentClusters = useMemo(
    () => clusterAccidents(filteredAccidents),
    [filteredAccidents],
  );

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return centraline
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [centraline, query]);

  // Map mount / layer redraw — selection is React state only (panel), not a remount trigger.
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
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      if (districts?.features?.length) {
        L.geoJSON(districts as GeoJSON.GeoJsonObject, {
          style: {
            color: "#083f4c",
            weight: 1,
            opacity: 0.35,
            fillOpacity: 0.04,
            fillColor: "#1a8a9e",
          },
          interactive: false,
        }).addTo(map);
      }

      if (showCentraline) {
        for (const c of centraline) {
          const key = deviceKey(c);
          const total = byDevice.get(key)?.total ?? 0;
          const intensity = Math.max(0.25, total / maxTotal);
          const marker = L.circleMarker([c.latitude, c.longitude], {
            radius: 7 + intensity * 10,
            color: "#083f4c",
            weight: 1,
            fillColor: "#1a8a9e",
            fillOpacity: 0.35 + intensity * 0.55,
          });
          marker.bindTooltip(`${c.code} · ${c.name}`);
          marker.on("click", () => setSelectedKey(key));
          marker.addTo(map);
        }
      }

      for (const cluster of accidentClusters) {
        const hasInjury = cluster.injuries > 0;
        const radius = Math.min(18, 3.5 + Math.sqrt(cluster.count) * 2.2);
        L.circleMarker([cluster.latitude, cluster.longitude], {
          radius,
          color: hasInjury ? "#8a2f1d" : "#c45c3e",
          weight: 1,
          fillColor: hasInjury ? "#c45c3e" : "#d4b896",
          fillOpacity: 0.65,
        })
          .bindTooltip(
            cluster.count > 1
              ? `${cluster.count} incidenti in zona · ${cluster.injuries} con lesioni`
              : `${cluster.sample.date || "data n/d"} · ${
                  cluster.sample.roadType || "strada"
                } · ${cluster.sample.injuries ? "con lesioni" : "senza lesioni"}`,
          )
          .addTo(map!);
      }

      if (!didFlyToDeepLink.current && initialSelectedKey) {
        const focus = centraline.find((c) => deviceKey(c) === initialSelectedKey);
        if (focus) {
          map.setView([focus.latitude, focus.longitude], 14, { animate: false });
          didFlyToDeepLink.current = true;
        }
      }

      setReady(true);
    }

    void mount();
    return () => {
      cancelled = true;
      map?.remove();
      setReady(false);
    };
    // Selection (`selectedKey`) is panel-only and must not remount the map.
  }, [
    centraline,
    byDevice,
    maxTotal,
    accidentClusters,
    showCentraline,
    districts,
    initialSelectedKey,
  ]);

  const recent = selectedFlow?.series.slice(-14) ?? [];
  const recentAvg =
    recent.length > 0 ? recent.reduce((s, p) => s + p.value, 0) / recent.length : 0;

  function selectCentralina(key: string) {
    setSelectedKey(key);
    setQuery("");
  }

  return (
    <div className="map-shell">
      <div className="map-frame" aria-busy={!ready}>
        <div id="vista-map" style={{ width: "100%", height: "100%", minHeight: "60vh" }} />
      </div>
      <aside className="side-panel panel">
        <div className="chip-row" role="group" aria-label="Livelli mappa">
          <button
            type="button"
            className="chip"
            aria-pressed={showCentraline}
            onClick={() => setShowCentraline((v) => !v)}
          >
            Centraline
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={showAccidents}
            onClick={() => setShowAccidents((v) => !v)}
          >
            Incidenti
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={injuriesOnly}
            disabled={!showAccidents}
            onClick={() => setInjuriesOnly((v) => !v)}
          >
            Solo lesioni
          </button>
        </div>

        <label className="muted" htmlFor="centralina-search" style={{ fontSize: "0.85rem" }}>
          Cerca centralina
        </label>
        <input
          id="centralina-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchHits[0]) {
              e.preventDefault();
              selectCentralina(deviceKey(searchHits[0]));
            }
          }}
          placeholder="Codice o nome…"
          autoComplete="off"
          style={{
            width: "100%",
            padding: "0.45rem 0.65rem",
            border: "1px solid var(--vb-line)",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.7)",
            font: "inherit",
          }}
        />
        {searchHits.length > 0 ? (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {searchHits.map((c) => {
              const key = deviceKey(c);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => selectCentralina(key)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.4rem 0.5rem",
                      border: "1px solid var(--vb-line)",
                      borderRadius: "6px",
                      background:
                        key === selectedKey ? "rgba(26,138,158,0.15)" : "transparent",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    <strong>{c.code}</strong>
                    <span className="muted"> · {c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.trim() ? (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Nessuna centralina trovata.
          </p>
        ) : null}

        <p className="section__eyebrow">Centralina</p>
        <h2>{selected?.name ?? "Seleziona un punto"}</h2>
        {selected ? (
          <>
            <p className="muted">
              Codice {selected.code} · {selected.detectors.length} spire · db{" "}
              {selected.device_db}/{selected.device_id}
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
          <p className="muted">Clicca un marker sulla mappa o cerca per codice/nome.</p>
        )}
        {showAccidents ? (
          <p className="muted" style={{ marginTop: "auto" }}>
            Overlay incidenti: {filteredAccidents.length.toLocaleString("it-IT")} eventi ·{" "}
            {accidentClusters.length.toLocaleString("it-IT")} marker in griglia
          </p>
        ) : null}
      </aside>
    </div>
  );
}
