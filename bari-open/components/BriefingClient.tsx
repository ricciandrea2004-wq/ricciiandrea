"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { PrintButton } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";

export type BriefingAnomaly = {
  key: string;
  name: string;
  code: string;
  recentAvg: number;
  baselineMedian: number;
  pctDeviation: number;
};

export type BriefingHotspot = {
  key: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  injuryAccidents: number;
  trafficTotal: number;
  districtName?: string;
};

type Props = {
  findings: string[];
  anomalies: BriefingAnomaly[];
  hotspots: BriefingHotspot[];
  profileLabel: string;
  syncedLabel: string;
  dateLabel: string;
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("it-IT").format(Math.round(n));
}

function severityOf(pct: number): { label: string; className: string } {
  const abs = Math.abs(pct);
  if (abs >= 40) return { label: "alta", className: "sev sev--high" };
  if (abs >= 20) return { label: "media", className: "sev sev--mid" };
  return { label: "bassa", className: "sev sev--low" };
}

export function BriefingClient({
  findings,
  anomalies,
  hotspots,
  profileLabel,
  syncedLabel,
  dateLabel,
}: Props) {
  const { t } = useI18n();
  const [days, setDays] = useState<7 | 14 | 30>(7);

  const windowNote = useMemo(() => {
    if (days === 7) return "Finestra operativa: ultimi 7 giorni (baseline anomalie).";
    if (days === 14) return "Finestra estesa 14 giorni — utile per briefing quindicinale.";
    return "Finestra 30 giorni — sintesi mensile per assessorato.";
  }, [days]);

  return (
    <>
      <div className="page-hero briefing-hero">
        <p className="section__eyebrow">Sintesi operativa</p>
        <h1>Briefing settimanale mobilità — Bari</h1>
        <p className="section__lead">
          Lettura dei flussi e della sicurezza stradale da open data comunali. Data briefing:{" "}
          <strong>{dateLabel}</strong> (Europe/Rome). Sync dataset: {syncedLabel}.
        </p>
        <div className="chip-row no-print" role="group" aria-label="Intervallo briefing">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              className="chip"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
            >
              Ultimi {d} giorni
            </button>
          ))}
        </div>
        <p className="muted no-print">{windowNote}</p>
        <div className="cta-row no-print">
          <PrintButton label="Stampa / salva PDF" />
          <a className="btn btn--ghost-dark" href={`/api/briefing/markdown?days=${days}`}>
            Scarica Markdown
          </a>
          <Link className="btn btn--ghost-dark" href="/briefing/email">
            Anteprima email
          </Link>
          <Link className="btn btn--ghost-dark" href="/mappa">
            Apri la mappa
          </Link>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.35rem" }}>Cinque finding</h2>
        <ol className="briefing-findings">
          {findings.map((finding, i) => (
            <li key={`${i}-${finding.slice(0, 24)}`}>
              <div className="finding-row">
                <span>{finding}</span>
                <CopyButton text={finding} label={t("copy")} className="chip no-print" />
              </div>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>
          {profileLabel}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.35rem" }}>Anomalie di traffico</h2>
        <p className="muted">
          Incroci con scostamento rilevante rispetto al baseline. Badge di severità e link mappa.
        </p>
        {anomalies.length === 0 ? (
          <p className="muted empty-inline">Nessuna anomalia in evidenza sul calcolo attuale.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Incrocio</th>
                <th>Codice</th>
                <th>Severità</th>
                <th>Scostamento</th>
                <th>Media recente</th>
                <th>Baseline</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((row) => {
                const sev = severityOf(row.pctDeviation);
                return (
                  <tr key={row.key}>
                    <td>
                      <Link href={`/mappa?c=${encodeURIComponent(row.key)}`}>{row.name}</Link>
                    </td>
                    <td>{row.code || "—"}</td>
                    <td>
                      <span className={sev.className}>{sev.label}</span>
                    </td>
                    <td>
                      {row.pctDeviation > 0 ? "+" : ""}
                      {row.pctDeviation.toFixed(1)}%
                    </td>
                    <td>{formatNumber(row.recentAvg)}</td>
                    <td>{formatNumber(row.baselineMedian)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: "1.35rem" }}>Hotspot sicurezza</h2>
        <p className="muted">
          Punti con più incidenti con lesioni nelle vicinanze. I mini-link aprono la mappa in una
          nuova scheda.
        </p>
        {hotspots.length === 0 ? (
          <p className="muted empty-inline">Nessun hotspot in evidenza sul calcolo attuale.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Incrocio</th>
                <th>Codice</th>
                <th>Lesioni vicine</th>
                <th>Traffico</th>
                <th className="no-print">Mappa</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((row) => (
                <tr key={row.key}>
                  <td>{row.name}</td>
                  <td>{row.code || "—"}</td>
                  <td>{formatNumber(row.injuryAccidents)}</td>
                  <td>{formatNumber(row.trafficTotal)}</td>
                  <td className="no-print">
                    <a
                      href={`/mappa?c=${encodeURIComponent(row.key)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Apri ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
