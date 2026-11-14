"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ErrorBoundary } from "./ErrorBoundary";

type WeatherPayload = {
  ok: boolean;
  temperatureC?: number | null;
  precipitationMm?: number | null;
  windSpeedKmh?: number | null;
  error?: string;
};

function WeatherInner() {
  const { t } = useI18n();
  const [data, setData] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/live/weather")
      .then((r) => r.json())
      .then((json: WeatherPayload) => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData({
            ok: false,
            error: err instanceof Error ? err.message : "errore",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="home-card skeleton-card" aria-busy="true">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--short" />
      </div>
    );
  }

  if (!data.ok) {
    return (
      <div className="home-card" role="status">
        <p className="section__eyebrow">{t("weather")}</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          Meteo non disponibile{data.error ? `: ${data.error}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="home-card">
      <p className="section__eyebrow">{t("weather")}</p>
      <p className="home-card__value">
        {data.temperatureC != null ? `${Math.round(data.temperatureC)}°C` : "—"}
      </p>
      <p className="muted" style={{ marginBottom: 0 }}>
        Pioggia {data.precipitationMm ?? 0} mm · vento{" "}
        {data.windSpeedKmh != null ? `${Math.round(data.windSpeedKmh)} km/h` : "—"}
      </p>
    </div>
  );
}

export function WeatherWidget() {
  return (
    <ErrorBoundary fallbackTitle="Meteo non disponibile">
      <WeatherInner />
    </ErrorBoundary>
  );
}
