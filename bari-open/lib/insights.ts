import { deviceKey } from "./device-key";
import { haversineMeters, pointInGeometry } from "./geo";
import { aggregateCityDaily, deviceTotals } from "./parse";
import type { Centralina, FlowPoint, VistaDataBundle } from "./types";

const HOTSPOT_RADIUS_M = 180;
const ANOMALY_LIMIT = 8;
const HOTSPOT_LIMIT = 8;
const RECENT_DAYS = 7;

export type TrafficAnomaly = {
  key: string;
  name: string;
  code: string;
  recentAvg: number;
  baselineMedian: number;
  pctDeviation: number;
};

export type SafetyHotspot = {
  key: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  injuryAccidents: number;
  trafficTotal: number;
  districtName?: string;
};

export type WeekdayWeekendProfile = {
  weekdayAvg: number;
  weekendAvg: number;
  weekdayDays: number;
  weekendDays: number;
  /** weekendAvg / weekdayAvg (1 = pari). */
  ratio: number;
};

export type VistaInsights = {
  trafficAnomalies: TrafficAnomaly[];
  safetyHotspots: SafetyHotspot[];
  weekdayWeekendProfile: WeekdayWeekendProfile;
  briefingFindings: string[];
};

function utcWeekday(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay(); // 0=Sun … 6=Sat
}

function isWeekend(isoDate: string): boolean {
  const d = utcWeekday(isoDate);
  return d === 0 || d === 6;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

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

function centralinaIndex(centraline: Centralina[]): Map<string, Centralina> {
  return new Map(centraline.map((c) => [deviceKey(c), c]));
}

function formatIt(n: number): string {
  return new Intl.NumberFormat("it-IT").format(Math.round(n));
}

function districtNameForPoint(
  bundle: VistaDataBundle,
  lat: number,
  lon: number,
): string | undefined {
  const districts = bundle.districts;
  if (!districts?.features?.length) return undefined;
  for (const f of districts.features) {
    if (!f.geometry || (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon")) {
      continue;
    }
    if (pointInGeometry(lon, lat, f.geometry)) {
      const props = f.properties ?? {};
      const name =
        (props.nome as string) ||
        (props.name as string) ||
        (props.NOME as string) ||
        (props.circoscrizione as string) ||
        (props.municipio as string) ||
        (props.MUNICIPIO as string);
      if (name) return String(name);
    }
  }
  return undefined;
}

/**
 * Top devices by |%| deviation of last-7-day average vs median of
 * same-weekday historical daily totals (excluding the recent window).
 */
export function trafficAnomalies(
  bundle: VistaDataBundle,
  limit = ANOMALY_LIMIT,
): TrafficAnomaly[] {
  const byDevice = deviceDailySeries(bundle.flows);
  const byKey = centralinaIndex(bundle.centraline);
  const anomalies: TrafficAnomaly[] = [];

  for (const [key, series] of byDevice) {
    if (series.length < RECENT_DAYS + 14) continue;
    const recent = series.slice(-RECENT_DAYS);
    const historical = series.slice(0, -RECENT_DAYS);
    if (!historical.length) continue;

    const recentAvg = mean(recent.map((p) => p.value));
    const weekdayMedians = new Map<number, number>();
    for (let wd = 0; wd < 7; wd++) {
      const vals = historical.filter((p) => utcWeekday(p.date) === wd).map((p) => p.value);
      if (vals.length) weekdayMedians.set(wd, median(vals));
    }

    const baselineParts = recent
      .map((p) => weekdayMedians.get(utcWeekday(p.date)))
      .filter((v): v is number => v !== undefined && v > 0);
    if (!baselineParts.length) continue;
    const baselineMedian = mean(baselineParts);
    if (baselineMedian <= 0) continue;

    const pctDeviation = ((recentAvg - baselineMedian) / baselineMedian) * 100;
    const c = byKey.get(key);
    anomalies.push({
      key,
      name: c?.name ?? key,
      code: c?.code ?? key,
      recentAvg,
      baselineMedian,
      pctDeviation,
    });
  }

  return anomalies
    .sort((a, b) => Math.abs(b.pctDeviation) - Math.abs(a.pctDeviation))
    .slice(0, limit);
}

/**
 * Top devices by injury-accident count within ~180 m; traffic total breaks ties.
 */
export function safetyHotspots(
  bundle: VistaDataBundle,
  limit = HOTSPOT_LIMIT,
  radiusM = HOTSPOT_RADIUS_M,
): SafetyHotspot[] {
  const totals = deviceTotals(bundle.flows);
  const injuries = bundle.accidents.filter((a) => a.injuries);
  const hotspots: SafetyHotspot[] = [];

  for (const c of bundle.centraline) {
    const key = deviceKey(c);
    let injuryAccidents = 0;
    for (const a of injuries) {
      if (haversineMeters(c.latitude, c.longitude, a.latitude, a.longitude) <= radiusM) {
        injuryAccidents += 1;
      }
    }
    if (injuryAccidents <= 0) continue;
    hotspots.push({
      key,
      name: c.name,
      code: c.code,
      latitude: c.latitude,
      longitude: c.longitude,
      injuryAccidents,
      trafficTotal: totals.get(key) ?? 0,
      districtName: districtNameForPoint(bundle, c.latitude, c.longitude),
    });
  }

  return hotspots
    .sort((a, b) => {
      if (b.injuryAccidents !== a.injuryAccidents) {
        return b.injuryAccidents - a.injuryAccidents;
      }
      return b.trafficTotal - a.trafficTotal;
    })
    .slice(0, limit);
}

/** City-wide weekday vs weekend average daily totals. */
export function weekdayWeekendProfile(bundle: VistaDataBundle): WeekdayWeekendProfile {
  const city = aggregateCityDaily(bundle.flows);
  const weekday: number[] = [];
  const weekend: number[] = [];
  for (const p of city) {
    if (isWeekend(p.date)) weekend.push(p.value);
    else weekday.push(p.value);
  }
  const weekdayAvg = mean(weekday);
  const weekendAvg = mean(weekend);
  return {
    weekdayAvg,
    weekendAvg,
    weekdayDays: weekday.length,
    weekendDays: weekend.length,
    ratio: weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0,
  };
}

/** Five deterministic Italian briefing strings for assessori. */
export function briefingFindings(bundle: VistaDataBundle): string[] {
  const anomalies = trafficAnomalies(bundle);
  const hotspots = safetyHotspots(bundle);
  const profile = weekdayWeekendProfile(bundle);
  const { summary } = bundle;
  const topAnomaly = anomalies[0];
  const topHotspot = hotspots[0];

  const findings: string[] = [
    `Copertura flussi: ${summary.flowDays} giorni su ${summary.flowMonths} mesi; media giornaliera cittadina circa ${formatIt(summary.cityDailyAvg)} veicoli-spira.`,
  ];

  if (topAnomaly) {
    const dir = topAnomaly.pctDeviation >= 0 ? "sopra" : "sotto";
    findings.push(
      `Anomalia traffico: ${topAnomaly.code} (${topAnomaly.name}) negli ultimi 7 giorni è ${dir} della mediana storica del medesimo giorno della settimana di circa ${formatIt(Math.abs(topAnomaly.pctDeviation))}%.`,
    );
  } else {
    findings.push(
      "Anomalie traffico: nessun scostamento significativo rilevabile con la serie storica disponibile.",
    );
  }

  if (topHotspot) {
    const where = topHotspot.districtName
      ? ` (${topHotspot.districtName})`
      : "";
    findings.push(
      `Hotspot sicurezza: ${topHotspot.code} (${topHotspot.name})${where} concentra ${topHotspot.injuryAccidents} incidenti con lesioni entro 180 m, con traffico cumulato ${formatIt(topHotspot.trafficTotal)}.`,
    );
  } else {
    findings.push(
      "Hotspot sicurezza: nessun cluster di incidenti con lesioni entro 180 m dalle centraline.",
    );
  }

  const weekendPct = profile.weekdayAvg
    ? Math.round((profile.ratio - 1) * 100)
    : 0;
  const weekendLabel =
    weekendPct >= 0
      ? `${weekendPct}% più alto`
      : `${Math.abs(weekendPct)}% più basso`;
  findings.push(
    `Profilo feriale/festivo: media feriale ${formatIt(profile.weekdayAvg)}, media weekend ${formatIt(profile.weekendAvg)} (${weekendLabel} rispetto ai feriali).`,
  );

  findings.push(
    `Sintesi incidenti 2025: ${formatIt(summary.accidentCount)} eventi geolocalizzati, di cui ${formatIt(summary.injuryAccidents)} con lesioni (${summary.accidentCount ? Math.round((summary.injuryAccidents / summary.accidentCount) * 100) : 0}%); ${summary.centralineCount} centraline monitorate.`,
  );

  return findings.slice(0, 5);
}

export function getInsights(bundle: VistaDataBundle): VistaInsights {
  return {
    trafficAnomalies: trafficAnomalies(bundle),
    safetyHotspots: safetyHotspots(bundle),
    weekdayWeekendProfile: weekdayWeekendProfile(bundle),
    briefingFindings: briefingFindings(bundle),
  };
}
