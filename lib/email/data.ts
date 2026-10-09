// Where the scheduled emails get their recipients and signals.
//
// The workspace still runs on demo data (lib/demo-data.ts): there are no real organisations,
// members or signals in the database yet. Until they exist these loaders return no jobs, so the
// crons run, log "0 email" and send nothing. When the schema lands, replace the two bodies
// below with Supabase queries (server-side key) and keep the same return shapes.
import type { RiepilogoSettimanale, SegnaleEmail, SegnaliDaVerificare } from "./templates";

export type Job<T> = { to: string; data: T; key: string };
export type Batch<T> = { origine: string; jobs: Job<T>[] };

const NO_DATABASE = "nessun database dei segnali collegato: i dati del workspace sono di esempio";

/** The 7 days before `now` (Monday 00:00 Rome → Sunday), for the Monday summary. */
export function lastWeek(now: Date) {
  const a = new Date(now.getTime() - 86_400_000);
  const da = new Date(now.getTime() - 7 * 86_400_000);
  return { da: da.toISOString(), a: a.toISOString() };
}

/** One summary per member who has the weekly summary on. */
export async function weeklySummaries(now: Date): Promise<Batch<RiepilogoSettimanale>> {
  void now;
  return { origine: NO_DATABASE, jobs: [] };
}

/** Days a signal may stay "Da verificare" before the alert. */
export function staleThresholdDays() {
  const n = Number(process.env.EMAIL_SOGLIA_DA_VERIFICARE_GIORNI ?? 3);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 3;
}

/**
 * Signals that crossed the threshold in the last 24 hours. The cron runs once a day, so each
 * signal is announced once, the day it becomes late, and not again every morning.
 */
export function crossedToday(signals: SegnaleEmail[], now: Date, days: number) {
  const from = now.getTime() - (days + 1) * 86_400_000;
  const to = now.getTime() - days * 86_400_000;
  return signals.filter((s) => {
    const t = new Date(s.osservatoIl).getTime();
    return s.stato === "to_verify" && t > from && t <= to;
  });
}

/** One alert per member of each organisation that has signals that just became late. */
export async function staleSignalAlerts(now: Date): Promise<Batch<SegnaliDaVerificare>> {
  void now;
  return { origine: NO_DATABASE, jobs: [] };
}
