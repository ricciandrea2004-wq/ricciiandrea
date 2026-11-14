"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deviceKey } from "@/lib/device-key";
import { useI18n } from "@/lib/i18n";
import type { MapAccident, MapDistricts, MapPayload } from "@/lib/map-data";

const EMPTY_ACCIDENTS: MapAccident[] = [];
const ACCIDENT_MARKER_CAP = 800;
const HISTORY_KEY = "vista-bari-recent-centraline";
const BOOKMARK_KEY = "vista-bari-bookmarks";

type AccidentCluster = {
  latitude: number;
  longitude: number;
  count: number;
  injuries: number;
  items: MapAccident[];
};

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
      prev.items.push(a);
    } else {
      cells.set(key, {
        latitude: lat,
        longitude: lon,
        count: 1,
        injuries: a.injuries ? 1 : 0,
        items: [a],
      });
    }
  }
  let list = [...cells.values()];
  if (list.length > cap) {
    list.sort((a, b) => b.count - a.count);
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

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* ignore */
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Props = {
  payload: MapPayload;
  initialSelectedKey?: string | null;
  initialShowAccidents?: boolean;
  accidentFilter?: {
    injuriesOnly?: boolean;
    weather?: string;
    roadType?: string;
    pavement?: "all" | "wet" | "dry";
    propertyDamage?: "all" | "yes" | "no";
    year?: string;
  };
  districts?: MapDistricts;
};

export function TrafficMap({
  payload,
  initialSelectedKey = null,
  initialShowAccidents = false,
  accidentFilter,
  districts: districtsProp,
}: Props) {
  const { t } = useI18n();
  const { centraline, deviceFlows } = payload;
  const accidents = payload.accidents ?? EMPTY_ACCIDENTS;
  const districts = districtsProp ?? payload.districts;

  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    resolveInitialKey(centraline, initialSelectedKey),
  );
  const [compareKey, setCompareKey] = useState<string | null>(null);
  const [compareArmed, setCompareArmed] = useState(false);
  const [showCentraline, setShowCentraline] = useState(true);
  const [showAccidents, setShowAccidents] = useState(initialShowAccidents);
  const [injuriesOnly, setInjuriesOnly] = useState(
    () => accidentFilter?.injuriesOnly ?? false,
  );
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePts, setMeasurePts] = useState<Array<[number, number]>>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [heatMode, setHeatMode] = useState(false);
  const [minFlow, setMinFlow] = useState(0);
  const [opacity, setOpacity] = useState(0.75);
  const [recent, setRecent] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [clusterList, setClusterList] = useState<AccidentCluster | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const didFlyToDeepLink = useRef(false);
  const selectRef = useRef<(key: string) => void>(() => undefined);

  useEffect(() => {
    setRecent(readList(HISTORY_KEY).slice(0, 8));
    setBookmarks(readList(BOOKMARK_KEY));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byDevice = useMemo(() => {
    return new Map(deviceFlows.map((f) => [f.key, f]));
  }, [deviceFlows]);

  const maxTotal = useMemo(() => {
    let m = 1;
    for (const v of deviceFlows) m = Math.max(m, v.total);
    return m;
  }, [deviceFlows]);

  const avgByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of deviceFlows) {
      const days = f.series.length || 1;
      map.set(f.key, f.total / days);
    }
    return map;
  }, [deviceFlows]);

  const selected = centraline.find((c) => deviceKey(c) === selectedKey) ?? null;
  const selectedFlow = selected ? byDevice.get(deviceKey(selected)) : undefined;
  const compare = centraline.find((c) => deviceKey(c) === compareKey) ?? null;
  const compareFlow = compare ? byDevice.get(deviceKey(compare)) : undefined;

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
      if (accidentFilter?.roadType && accidentFilter.roadType !== "tutti") {
        if (a.roadType !== accidentFilter.roadType) return false;
      }
      if (accidentFilter?.pavement === "wet") {
        if (!/bagnato|umid|brina|viscido/i.test(a.pavementState || "")) return false;
      }
      if (accidentFilter?.pavement === "dry") {
        if (!/asciutto/i.test(a.pavementState || "")) return false;
      }
      if (accidentFilter?.propertyDamage === "yes" && !a.propertyDamage) return false;
      if (accidentFilter?.propertyDamage === "no" && a.propertyDamage) return false;
      if (accidentFilter?.year && !a.date.startsWith(accidentFilter.year)) return false;
      return true;
    });
  }, [accidents, showAccidents, injuriesOnly, accidentFilter]);

  const accidentClusters = useMemo(
    () => clusterAccidents(filteredAccidents),
    [filteredAccidents],
  );

  const visibleCentraline = useMemo(() => {
    return centraline.filter((c) => {
      const avg = avgByKey.get(deviceKey(c)) ?? 0;
      return avg >= minFlow;
    });
  }, [centraline, avgByKey, minFlow]);

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return visibleCentraline
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [visibleCentraline, query]);

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
        scrollWheelZoom: true,
      });
      mapRef.current = map;

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
            opacity: 0.35 * opacity,
            fillOpacity: 0.04 * opacity,
            fillColor: "#1a8a9e",
          },
          interactive: false,
        }).addTo(map);
      }

      if (showCentraline) {
        for (const c of visibleCentraline) {
          const key = deviceKey(c);
          const total = byDevice.get(key)?.total ?? 0;
          const intensity = Math.max(0.25, total / maxTotal);
          const fill = heatMode
            ? `hsl(${28 - intensity * 28}, 72%, ${48 + intensity * 10}%)`
            : "#1a8a9e";
          const marker = L.circleMarker([c.latitude, c.longitude], {
            radius: heatMode ? 6 + intensity * 14 : 7 + intensity * 10,
            color: "#083f4c",
            weight: 1,
            fillColor: fill,
            fillOpacity: (0.35 + intensity * 0.55) * opacity,
          });
          const score = payload.safetyByKey?.[key];
          marker.bindTooltip(
            `${c.code} · ${c.name}${score != null ? ` · safety ${score}` : ""}`,
          );
          marker.on("click", () => selectRef.current(key));
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
          fillOpacity: 0.65 * opacity,
        })
          .bindTooltip(
            cluster.count > 1
              ? `${cluster.count} incidenti · ${cluster.injuries} con lesioni (clic per elenco)`
              : `${cluster.items[0]?.date || "data n/d"} · ${
                  cluster.items[0]?.roadType || "strada"
                }`,
          )
          .on("click", () => setClusterList(cluster))
          .addTo(map!);
      }

      if (measurePts.length) {
        for (const pt of measurePts) {
          L.circleMarker(pt, {
            radius: 5,
            color: "#c45c3e",
            fillColor: "#c45c3e",
            fillOpacity: 1,
          }).addTo(map);
        }
        if (measurePts.length === 2) {
          L.polyline(measurePts, { color: "#c45c3e", weight: 2, dashArray: "6 4" }).addTo(map);
        }
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        if (!measureMode) return;
        setMeasurePts((prev) => {
          const next: Array<[number, number]> = [...prev, [e.latlng.lat, e.latlng.lng]];
          return next.slice(-2);
        });
      });

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
      mapRef.current = null;
      setReady(false);
    };
  }, [
    centraline,
    visibleCentraline,
    byDevice,
    maxTotal,
    accidentClusters,
    showCentraline,
    districts,
    initialSelectedKey,
    heatMode,
    opacity,
    measureMode,
    measurePts,
    payload.safetyByKey,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    window.setTimeout(() => map.invalidateSize(), 80);
  }, [fullscreen, mobileSheetOpen]);

  const recentSeries = selectedFlow?.series.slice(-14) ?? [];
  const recentAvg =
    recentSeries.length > 0
      ? recentSeries.reduce((s, p) => s + p.value, 0) / recentSeries.length
      : 0;

  function selectCentralina(key: string) {
    if (compareArmed && selectedKey && key !== selectedKey) {
      setCompareKey(key);
      setCompareArmed(false);
    } else {
      setSelectedKey(key);
    }
    setQuery("");
    setMobileSheetOpen(true);
    setRecent((prev) => {
      const next = [key, ...prev.filter((k) => k !== key)].slice(0, 8);
      writeList(HISTORY_KEY, next);
      return next;
    });
  }
  selectRef.current = selectCentralina;

  function toggleBookmark(key: string) {
    setBookmarks((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      writeList(BOOKMARK_KEY, next);
      return next;
    });
  }

  async function copyCoords() {
    if (!selected) return;
    const text = `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  function locateMe() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14, {
          animate: true,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function toggleFullscreen() {
    const el = shellRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  useEffect(() => {
    function onFs() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const measureKm =
    measurePts.length === 2
      ? haversineKm(measurePts[0][0], measurePts[0][1], measurePts[1][0], measurePts[1][1])
      : null;

  const labelFor = (key: string) => {
    const c = centraline.find((x) => deviceKey(x) === key);
    return c ? `${c.code} · ${c.name}` : key;
  };

  return (
    <div className={`map-shell${fullscreen ? " map-shell--fullscreen" : ""}`} ref={shellRef}>
      <div className="map-frame" aria-busy={!ready}>
        <div className="map-toolbar no-print" role="toolbar" aria-label="Controlli mappa">
          <button type="button" className="chip" onClick={() => void toggleFullscreen()}>
            {t("fullscreen")}
          </button>
          <button type="button" className="chip" onClick={locateMe}>
            {t("locate")}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={measureMode}
            onClick={() => {
              setMeasureMode((v) => !v);
              setMeasurePts([]);
            }}
          >
            {t("measure")}
            {measureKm != null ? ` · ${measureKm.toFixed(2)} km` : ""}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={showLegend}
            onClick={() => setShowLegend((v) => !v)}
          >
            {t("legend")}
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={heatMode}
            onClick={() => setHeatMode((v) => !v)}
          >
            {t("heat")}
          </button>
        </div>
        {showLegend ? (
          <div className="map-legend panel" role="note">
            <strong>{t("legend")}</strong>
            <ul>
              <li>
                <span className="swatch swatch--sea" /> Centraline (raggio ∝ flusso)
              </li>
              <li>
                <span className="swatch swatch--coral" /> Incidenti con lesioni
              </li>
              <li>
                <span className="swatch swatch--sand" /> Incidenti senza lesioni
              </li>
              {heatMode ? <li>Modalità calore: colore ∝ traffico</li> : null}
            </ul>
          </div>
        ) : null}
        <div id="vista-map" style={{ width: "100%", height: "100%", minHeight: "60vh" }} />
      </div>

      <aside
        className={`side-panel panel${mobileSheetOpen ? " side-panel--open" : " side-panel--collapsed"}`}
      >
        <button
          type="button"
          className="sheet-toggle no-print"
          onClick={() => setMobileSheetOpen((v) => !v)}
          aria-expanded={mobileSheetOpen}
        >
          {mobileSheetOpen ? "Chiudi scheda" : "Apri scheda centralina"}
        </button>

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

        <label className="muted" htmlFor="layer-opacity" style={{ fontSize: "0.85rem" }}>
          {t("opacity")}: {Math.round(opacity * 100)}%
        </label>
        <input
          id="layer-opacity"
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
        />

        <label className="muted" htmlFor="min-flow" style={{ fontSize: "0.85rem" }}>
          {t("min_flow")}: {Math.round(minFlow).toLocaleString("it-IT")}
        </label>
        <input
          id="min-flow"
          type="range"
          min={0}
          max={Math.max(1000, Math.round(maxTotal / 30))}
          step={100}
          value={minFlow}
          onChange={(e) => setMinFlow(Number(e.target.value))}
        />

        <label className="muted" htmlFor="centralina-search" style={{ fontSize: "0.85rem" }}>
          Cerca centralina <kbd className="kbd-hint">/</kbd>
        </label>
        <input
          ref={searchRef}
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
          className="map-search-input"
        />
        {searchHits.length > 0 ? (
          <ul className="search-hits">
            {searchHits.map((c) => {
              const key = deviceKey(c);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => selectCentralina(key)}
                    className={`search-hit${key === selectedKey ? " search-hit--active" : ""}`}
                  >
                    <strong>{c.code}</strong>
                    <span className="muted"> · {c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.trim() ? (
          <p className="muted empty-inline">Nessuna centralina trovata.</p>
        ) : null}

        {recent.length > 0 ? (
          <div>
            <p className="section__eyebrow">Recenti</p>
            <div className="chip-row">
              {recent.slice(0, 5).map((key) => (
                <button
                  key={key}
                  type="button"
                  className="chip"
                  aria-pressed={key === selectedKey}
                  onClick={() => selectCentralina(key)}
                >
                  {labelFor(key).slice(0, 28)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {bookmarks.length > 0 ? (
          <div>
            <p className="section__eyebrow">Segnalibri</p>
            <div className="chip-row">
              {bookmarks.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="chip"
                  aria-pressed={key === selectedKey}
                  onClick={() => selectCentralina(key)}
                >
                  {labelFor(key).slice(0, 28)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <p className="section__eyebrow">Centralina</p>
        <h2>{selected?.name ?? "Seleziona un punto"}</h2>
        {selected ? (
          <>
            <p className="muted">
              Codice {selected.code} · {selected.detectors.length} spire · db{" "}
              {selected.device_db}/{selected.device_id}
              {payload.safetyByKey?.[deviceKey(selected)] != null
                ? ` · safety score ${payload.safetyByKey[deviceKey(selected)]}`
                : ""}
            </p>
            <p>
              Flusso totale nel periodo sincronizzato:{" "}
              <strong>{Math.round(selectedFlow?.total ?? 0).toLocaleString("it-IT")}</strong>{" "}
              passaggi
            </p>
            <p className="muted">
              Media ultimi {recentSeries.length || "—"} giorni:{" "}
              {Math.round(recentAvg).toLocaleString("it-IT")} veicoli/giorno
            </p>
            <div className="chart-bars" style={{ height: 120 }}>
              {recentSeries.map((p) => {
                const max = Math.max(...recentSeries.map((x) => x.value), 1);
                return (
                  <span
                    key={p.date}
                    title={`${p.date}: ${p.value}`}
                    style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
                  />
                );
              })}
            </div>
            <div className="chip-row">
              <button
                type="button"
                className="chip"
                aria-pressed={bookmarks.includes(deviceKey(selected))}
                onClick={() => toggleBookmark(deviceKey(selected))}
              >
                {bookmarks.includes(deviceKey(selected)) ? t("bookmarked") : t("bookmark")}
              </button>
              <button
                type="button"
                className="chip"
                aria-pressed={compareArmed}
                onClick={() => {
                  setCompareArmed(true);
                  setCompareKey(null);
                }}
              >
                {compareArmed ? "Scegli 2ª…" : t("compare")}
              </button>
              <button type="button" className="chip" onClick={() => void copyCoords()}>
                {copied ? "OK" : t("coords")}
              </button>
              <a
                className="chip"
                href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("open_osm")}
              </a>
              <a
                className="chip"
                href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("open_gmaps")}
              </a>
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
          <p className="muted empty-inline">Clicca un marker sulla mappa o cerca per codice/nome.</p>
        )}

        {compare && selected && compareKey !== selectedKey ? (
          <div className="compare-panel">
            <p className="section__eyebrow">Confronto</p>
            <div className="compare-grid">
              <div>
                <strong>{selected.code}</strong>
                <p className="muted">{Math.round(selectedFlow?.total ?? 0).toLocaleString("it-IT")}</p>
              </div>
              <div>
                <strong>{compare.code}</strong>
                <p className="muted">{Math.round(compareFlow?.total ?? 0).toLocaleString("it-IT")}</p>
              </div>
            </div>
            <button type="button" className="chip" onClick={() => setCompareKey(null)}>
              Chiudi confronto
            </button>
          </div>
        ) : compare && selected && compareKey === selectedKey ? (
          <p className="muted">Seleziona un’altra centralina per confrontarla con questa.</p>
        ) : null}

        {clusterList ? (
          <div className="cluster-list">
            <p className="section__eyebrow">Cluster incidenti</p>
            <p className="muted">
              {clusterList.count} eventi · {clusterList.injuries} con lesioni
            </p>
            <ul>
              {clusterList.items.slice(0, 12).map((a, i) => (
                <li key={`${a.date}-${i}`}>
                  {a.date} · {a.roadType || "strada"} ·{" "}
                  {a.injuries ? "lesioni" : "senza lesioni"}
                </li>
              ))}
            </ul>
            <button type="button" className="chip" onClick={() => setClusterList(null)}>
              Chiudi elenco
            </button>
          </div>
        ) : null}

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
