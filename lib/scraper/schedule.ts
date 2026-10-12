// When a source is due. Each source has its own interval (default 24 hours); after three failed
// checks in a row the wait doubles at every new failure, up to a week, and a success resets it.
// The daily cron fires at about the same time every day, so a source counts as due up to an hour
// early: otherwise a 24-hour source checked at 05:00:30 would miss the next 05:00:10 run.
import type { Source } from "../domain";

export const DEFAULT_INTERVAL_HOURS = 24;
export const MIN_INTERVAL_HOURS = 1;
export const MAX_INTERVAL_HOURS = 720;
const BACKOFF_AFTER_FAILURES = 3;
const MAX_BACKOFF_HOURS = 168;
const EARLY_TOLERANCE_MS = 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function effectiveIntervalHours(source: Pick<Source, "checkIntervalHours" | "failureCount">) {
  const base = source.checkIntervalHours || DEFAULT_INTERVAL_HOURS;
  if (source.failureCount < BACKOFF_AFTER_FAILURES) return base;
  const stretched = base * 2 ** (source.failureCount - BACKOFF_AFTER_FAILURES + 1);
  return Math.max(base, Math.min(stretched, MAX_BACKOFF_HOURS));
}

// Milliseconds; a source never read is due from the start (0). Infinity when paused.
function nextCheckMs(source: Source) {
  if (source.status === "paused") return Infinity;
  if (!source.lastCheckedAt) return 0;
  return Date.parse(source.lastCheckedAt) + effectiveIntervalHours(source) * HOUR_MS;
}

// For people reading the API: null when paused, the time it was added when it was never read.
export function nextCheckAt(source: Source): string | null {
  const next = nextCheckMs(source);
  if (next === Infinity) return null;
  return next === 0 ? source.addedAt : new Date(next).toISOString();
}

export function isDue(source: Source, now = Date.now()) {
  return nextCheckMs(source) - EARLY_TOLERANCE_MS <= now;
}

// Due sources, never-checked first, then the most overdue.
export function dueSources(sources: Source[], now = Date.now()) {
  return sources.filter((s) => isDue(s, now)).sort((a, b) => nextCheckMs(a) - nextCheckMs(b));
}

export function isValidInterval(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= MIN_INTERVAL_HOURS && v <= MAX_INTERVAL_HOURS;
}
