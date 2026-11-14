"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

type Vehicle = {
  id: string;
  label: string;
  routeId: string;
  latitude: number;
  longitude: number;
  occupancy: string | null;
};

type ApiResponse = {
  ok: boolean;
  count?: number;
  vehicles?: Vehicle[];
  fetchedAt?: string;
  error?: string;
};

const REFRESH_MS = 30000;

function LiveBusMapInner() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [routeFilter, setRouteFilter] = useState("tutti");
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/live/amtab");
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json);
          setCountdown(REFRESH_MS / 1000);
        }
      } catch (err) {
        if (!cancelled) {
          setData({
            ok: false,
            error: err instanceof Error ? err.message : "errore rete",
          });
        }
      }
    }
    void load();
    const t = setInterval(() => {
      void load();
      setTick((n) => n + 1);
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_MS / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [tick]);

  const routes = useMemo(() => {
    const set = new Set<string>();
    for (const v of data?.vehicles ?? []) {
      if (v.routeId) set.add(v.routeId);
    }
    return ["tutti", ...[...set].sort((a, b) => a.localeCompare(b, "it", { numeric: true }))];
  }, [data]);

  const filtered = useMemo(() => {
    const list = data?.vehicles ?? [];
    if (routeFilter === "tutti") return list;
    return list.filter((v) => v.routeId === routeFilter);
  }, [data, routeFilter]);

  useEffect(() => {
    if (!data?.ok || !filtered.length) {
      setReady(false);
      return;
    }
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    async function mount() {
      const L = await import("leaflet");
      if (cancelled) return;
      const el = document.getElementById("live-bus-map");
      if (!el) return;
      el.innerHTML = "";
      map = L.map(el, {
        center: [41.12, 16.87],
        zoom: 12,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      for (const v of filtered) {
        L.circleMarker([v.latitude, v.longitude], {
          radius: 6,
          color: "#083f4c",
          weight: 1,
          fillColor: "#c45c3e",
          fillOpacity: 0.85,
        })
          .bindTooltip(`Linea ${v.routeId || "—"} · ${v.label || v.id}`)
          .addTo(map);
      }
      setReady(true);
    }

    void mount();
    return () => {
      cancelled = true;
      map?.remove();
      setReady(false);
    };
  }, [data, filtered]);

  return (
    <div>
      <div className="live-toolbar no-print">
        <p className="muted" style={{ margin: 0 }}>
          {data?.ok
            ? `${filtered.length} / ${data.count ?? 0} mezzi AMTAB · aggiornamento ${
                data.fetchedAt
                  ? new Date(data.fetchedAt).toLocaleTimeString("it-IT", {
                      timeZone: "Europe/Rome",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—"
              } · refresh tra ${countdown}s`
            : data?.error
              ? `Feed non disponibile: ${data.error}`
              : "Caricamento posizioni AMTAB…"}
        </p>
        <label className="live-route-filter">
          <span className="muted">Linea</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            aria-label="Filtro linea bus"
          >
            {routes.map((r) => (
              <option key={r} value={r}>
                {r === "tutti" ? "Tutte le linee" : `Linea ${r}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!data ? (
        <div className="map-frame skeleton-card" aria-busy="true" style={{ minHeight: "60vh" }}>
          <span className="skeleton-line" />
        </div>
      ) : !data.ok ? (
        <div className="panel feed-error" role="alert">
          <p className="muted" style={{ marginBottom: 0 }}>
            Impossibile caricare il feed AMTAB.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel empty-state">
          <p className="muted" style={{ marginBottom: 0 }}>
            Nessun mezzo per il filtro selezionato.
          </p>
        </div>
      ) : (
        <div className="map-frame" aria-busy={!ready}>
          <div id="live-bus-map" style={{ width: "100%", height: "100%", minHeight: "60vh" }} />
        </div>
      )}
    </div>
  );
}

export function LiveBusMap() {
  return (
    <ErrorBoundary fallbackTitle="Mappa bus live non disponibile">
      <LiveBusMapInner />
    </ErrorBoundary>
  );
}
