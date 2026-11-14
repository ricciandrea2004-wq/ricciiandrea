import { deviceKey } from "./device-key";
import { haversineMeters } from "./geo";
import { aggregateCityDaily, deviceTotals } from "./parse";
import type { Accident, Centralina, FlowPoint, VistaDataBundle } from "./types";

export type MomDelta = {
  currentMonth: string;
  previousMonth: string;
  currentAvg: number;
  previousAvg: number;
  /** Percent change current vs previous; null if previous unavailable. */
  pctDelta: number | null;
};

export type DeviceTrend = {
  key: string;
  name: string;
  code: string;
  recentAvg: number;
  priorAvg: number;
  pctChange: number;
};

export type SafetyScore = {
  key: string;
  name: string;
  code: string;
  injuryNearby: number;
  trafficTotal: number;
  /** 0–100 higher = safer (fewer injuries per traffic). */
  score: number;
};

export type MonthBucket = { month: string; count: number; injuries: number };

const WEEKDAY_IT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function deviceDailySeries(flows: VistaDataBundle["flows"]): Map<string, FlowPoint[]> {
  const map = new Map<string, Map<string, number>>();
  for (const flow of flows) {
    const key = deviceKey(flow);
    const byDate = map.get(key) ?? new Map<string, number>();
    for (const p of flow.series) {
      byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.value);
    }
    map.set(key, byDate);
  }
  const out = new Map<string, FlowPoint[]>();
  for (const [key, byDate] of map) {
    out.set(
      key,
      [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value })),
    );
  }
  return out;
}

/** City-wide month-over-month average daily traffic delta. */
export function cityMomDelta(bundle: VistaDataBundle): MomDelta {
  const city = aggregateCityDaily(bundle.flows);
  const byMonth = new Map<string, number[]>();
  for (const p of city) {
    const m = p.date.slice(0, 7);
    const list = byMonth.get(m) ?? [];
    list.push(p.value);
    byMonth.set(m, list);
  }
  const months = [...byMonth.keys()].sort();
  const currentMonth = months[months.length - 1] ?? "";
  const previousMonth = months[months.length - 2] ?? "";
  const currentAvg = mean(byMonth.get(currentMonth) ?? []);
  const previousAvg = mean(byMonth.get(previousMonth) ?? []);
  const pctDelta =
    previousMonth && previousAvg > 0
      ? ((currentAvg - previousAvg) / previousAvg) * 100
      : null;
  return { currentMonth, previousMonth, currentAvg, previousAvg, pctDelta };
}

/** Top improving / worsening devices by recent 14d vs prior 14d average. */
export function deviceTrends(
  bundle: VistaDataBundle,
  limit = 5,
): { improving: DeviceTrend[]; worsening: DeviceTrend[] } {
  const byDevice = deviceDailySeries(bundle.flows);
  const byKey = new Map(bundle.centraline.map((c) => [deviceKey(c), c]));
  const trends: DeviceTrend[] = [];

  for (const [key, series] of byDevice) {
    if (series.length < 28) continue;
    const recent = series.slice(-14);
    const prior = series.slice(-28, -14);
    const recentAvg = mean(recent.map((p) => p.value));
    const priorAvg = mean(prior.map((p) => p.value));
    if (priorAvg <= 0) continue;
    const pctChange = ((recentAvg - priorAvg) / priorAvg) * 100;
    const c = byKey.get(key);
    trends.push({
      key,
      name: c?.name ?? key,
      code: c?.code ?? key,
      recentAvg,
      priorAvg,
      pctChange,
    });
  }

  const sorted = [...trends].sort((a, b) => a.pctChange - b.pctChange);
  return {
    improving: sorted.slice(0, limit),
    worsening: [...sorted].reverse().slice(0, limit),
  };
}

export function injuryRatePct(bundle: VistaDataBundle): number {
  const { accidentCount, injuryAccidents } = bundle.summary;
  if (!accidentCount) return 0;
  return (injuryAccidents / accidentCount) * 100;
}

/** Safety score per centralina: injuries within 180 m vs traffic. */
export function safetyScores(
  bundle: VistaDataBundle,
  radiusM = 180,
): SafetyScore[] {
  const totals = deviceTotals(bundle.flows);
  const injuries = bundle.accidents.filter((a) => a.injuries);
  const raw: Array<{
    key: string;
    name: string;
    code: string;
    injuryNearby: number;
    trafficTotal: number;
    rate: number;
  }> = [];

  for (const c of bundle.centraline) {
    const key = deviceKey(c);
    let injuryNearby = 0;
    for (const a of injuries) {
      if (haversineMeters(c.latitude, c.longitude, a.latitude, a.longitude) <= radiusM) {
        injuryNearby += 1;
      }
    }
    const trafficTotal = totals.get(key) ?? 0;
    const rate = trafficTotal > 0 ? injuryNearby / (trafficTotal / 100_000) : injuryNearby * 10;
    raw.push({
      key,
      name: c.name,
      code: c.code,
      injuryNearby,
      trafficTotal,
      rate,
    });
  }

  const maxRate = Math.max(...raw.map((r) => r.rate), 0.0001);
  return raw
    .map(({ rate, ...rest }) => ({
      ...rest,
      score: Math.round(100 * (1 - rate / maxRate)),
    }))
    .sort((a, b) => a.score - b.score);
}

type AccidentLite = Pick<Accident, "date" | "injuries">;

export function monthlyAccidentHistogram(accidents: AccidentLite[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>();
  for (const a of accidents) {
    const month = (a.date || "").slice(0, 7);
    if (!month) continue;
    const prev = map.get(month) ?? { month, count: 0, injuries: 0 };
    prev.count += 1;
    if (a.injuries) prev.injuries += 1;
    map.set(month, prev);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Open data accidents are date-only (no hour). Expose weekday distribution instead
 * so the UI still surfaces “when” risk concentrates.
 */
export function accidentWeekdayHistogram(accidents: AccidentLite[]): Array<{
  weekday: number;
  label: string;
  count: number;
}> {
  const counts = Array.from({ length: 7 }, () => 0);
  for (const a of accidents) {
    if (!a.date) continue;
    const wd = new Date(`${a.date}T12:00:00Z`).getUTCDay();
    counts[wd] += 1;
  }
  return counts.map((count, weekday) => ({
    weekday,
    label: WEEKDAY_IT[weekday],
    count,
  }));
}

export function accidentYears(accidents: Array<Pick<Accident, "date">>): string[] {
  return [...new Set(accidents.map((a) => (a.date || "").slice(0, 4)).filter(Boolean))].sort();
}

export function topIntersectionsExport(
  bundle: VistaDataBundle,
  limit = 25,
): Array<{
  key: string;
  code: string;
  name: string;
  total: number;
  latitude: number | null;
  longitude: number | null;
}> {
  const totals = deviceTotals(bundle.flows);
  const byKey = new Map(bundle.centraline.map((c) => [deviceKey(c), c]));
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, total]) => {
      const c = byKey.get(key);
      return {
        key,
        code: c?.code ?? key,
        name: c?.name ?? key,
        total,
        latitude: c?.latitude ?? null,
        longitude: c?.longitude ?? null,
      };
    });
}

export function weekdayWeekendSeries(bundle: VistaDataBundle): {
  weekday: FlowPoint[];
  weekend: FlowPoint[];
} {
  const city = aggregateCityDaily(bundle.flows);
  const weekday: FlowPoint[] = [];
  const weekend: FlowPoint[] = [];
  for (const p of city) {
    const wd = new Date(`${p.date}T12:00:00Z`).getUTCDay();
    if (wd === 0 || wd === 6) weekend.push(p);
    else weekday.push(p);
  }
  return { weekday, weekend };
}

export function lookupCentralina(
  centraline: Centralina[],
  key: string,
): Centralina | undefined {
  return centraline.find((c) => deviceKey(c) === key);
}
