"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ErrorBoundary } from "./ErrorBoundary";

type AriaPayload = {
  ok: boolean;
  bariFeatures?: number;
  totalFeatures?: number;
  error?: string;
  features?: Array<{ properties?: Record<string, unknown> }>;
};

function pickPollutant(features: AriaPayload["features"]): string {
  if (!features?.length) return "Nessuna stazione Bari nel bollettino.";
  const p = features[0]?.properties ?? {};
  const name = String(p.NomeStazione ?? p.nome ?? p.Name ?? "Stazione");
  const pm10 = p.PM10 ?? p.pm10;
  const no2 = p.NO2 ?? p.no2;
  const bits = [
    name,
    pm10 != null ? `PM10 ${pm10}` : null,
    no2 != null ? `NO₂ ${no2}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

function AirInner() {
  const { t } = useI18n();
  const [data, setData] = useState<AriaPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/live/aria")
      .then((r) => r.json())
      .then((json: AriaPayload) => {
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
        <p className="section__eyebrow">{t("air")}</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          ARPA non raggiungibile al momento
          {data.error ? ` (${data.error})` : ""}. Riprova più tardi.
        </p>
      </div>
    );
  }

  return (
    <div className="home-card">
      <p className="section__eyebrow">{t("air")}</p>
      <p className="home-card__value">
        {data.bariFeatures ?? data.totalFeatures ?? 0} stazioni
      </p>
      <p className="muted" style={{ marginBottom: 0 }}>
        {pickPollutant(data.features)}
      </p>
    </div>
  );
}

export function AirQualityCard() {
  return (
    <ErrorBoundary fallbackTitle="Qualità aria non disponibile">
      <AirInner />
    </ErrorBoundary>
  );
}
