"use client";

import { useEffect, useState } from "react";

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

export function LiveBusMap() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/live/amtab");
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) setData(json);
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
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!data?.ok || !data.vehicles?.length) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    async function mount() {
      const L = await import("leaflet");
      if (cancelled) return;
      const el = document.getElementById("live-bus-map");
      if (!el) return;
      // reset container if remounting
      el.innerHTML = "";
      map = L.map(el, {
        center: [41.12, 16.87],
        zoom: 12,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      for (const v of data!.vehicles!) {
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
  }, [data]);

  return (
    <div>
      <p className="muted">
        {data?.ok
          ? `${data.count ?? 0} mezzi AMTAB · aggiornamento ${
              data.fetchedAt
                ? new Date(data.fetchedAt).toLocaleTimeString("it-IT", {
                    timeZone: "Europe/Rome",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—"
            } (Europe/Rome) · refresh 30s`
          : data?.error
            ? `Feed non disponibile: ${data.error}`
            : "Caricamento posizioni AMTAB…"}
      </p>
      <div className="map-frame" aria-busy={!ready}>
        <div id="live-bus-map" style={{ width: "100%", height: "100%", minHeight: "60vh" }} />
      </div>
    </div>
  );
}
