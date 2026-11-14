"use client";

import { useEffect, useState } from "react";

type Probe = { ok: boolean; ms: number; detail?: string };

type StatoJson = {
  live?: {
    amtab?: Probe;
    aria?: Probe;
    weather?: Probe;
  };
  checkedAt?: string;
};

export function StatoLiveProbes() {
  const [data, setData] = useState<StatoJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/stato")
      .then((r) => r.json())
      .then((json: StatoJson) => {
        if (!cancelled) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "errore");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="panel feed-error" role="alert">
        Impossibile interrogare /api/stato: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel skeleton-card" aria-busy="true">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--short" />
      </div>
    );
  }

  const rows: Array<[string, Probe | undefined]> = [
    ["AMTAB GTFS-RT", data.live?.amtab],
    ["ARPA aria", data.live?.aria],
    ["Open-Meteo", data.live?.weather],
  ];

  return (
    <div className="panel">
      <h2 style={{ fontSize: "1.3rem" }}>Feed live</h2>
      <p className="muted">
        Check {data.checkedAt ? new Date(data.checkedAt).toLocaleString("it-IT") : "—"}
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Servizio</th>
            <th>Stato</th>
            <th>Latenza</th>
            <th>Dettaglio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, probe]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>
                <span className={probe?.ok ? "sev sev--low" : "sev sev--high"}>
                  {probe?.ok ? "ok" : "down"}
                </span>
              </td>
              <td>{probe ? `${probe.ms} ms` : "—"}</td>
              <td className="muted">{probe?.detail ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
