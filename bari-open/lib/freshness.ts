/** Sync freshness helpers (Europe/Rome wall clock for display only). */

const MS_DAY = 24 * 60 * 60 * 1000;
export const FRESHNESS_SLA_DAYS = 7;

export function syncAgeDays(syncedAt: string, now = Date.now()): number {
  const t = Date.parse(syncedAt);
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - t) / MS_DAY);
}

export function isStale(syncedAt: string, slaDays = FRESHNESS_SLA_DAYS, now = Date.now()): boolean {
  return syncAgeDays(syncedAt, now) > slaDays;
}

export function freshnessLabel(syncedAt: string, now = Date.now()): {
  stale: boolean;
  ageDays: number;
  messageIt: string;
  messageEn: string;
} {
  const ageDays = syncAgeDays(syncedAt, now);
  const stale = ageDays > FRESHNESS_SLA_DAYS;
  const rounded = Math.floor(ageDays);
  return {
    stale,
    ageDays,
    messageIt: stale
      ? `Attenzione: sync dati più vecchio di ${FRESHNESS_SLA_DAYS} giorni (≈${rounded} g).`
      : `Dati entro lo SLA di ${FRESHNESS_SLA_DAYS} giorni (età ≈${rounded} g).`,
    messageEn: stale
      ? `Warning: data sync older than ${FRESHNESS_SLA_DAYS} days (≈${rounded} d).`
      : `Data within ${FRESHNESS_SLA_DAYS}-day SLA (age ≈${rounded} d).`,
  };
}
