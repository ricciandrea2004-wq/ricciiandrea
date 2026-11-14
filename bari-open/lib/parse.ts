import type { Accident, Centralina, DeviceFlow, FlowPoint } from "./types";

type RawCentralina = {
  device_id: number;
  device_type: number;
  device_db: number;
  properties?: {
    code?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
  };
  detectors?: Array<{
    detector_id: number;
    detector_code?: string;
    detector_description?: string;
  }>;
};

export function parseCentraline(jsonText: string): Centralina[] {
  const raw = JSON.parse(jsonText) as { traffic_controllers_info?: RawCentralina[] };
  const list = raw.traffic_controllers_info ?? [];
  return list
    .map((item) => ({
      device_id: item.device_id,
      device_type: item.device_type,
      device_db: item.device_db,
      code: item.properties?.code ?? `DEV-${item.device_id}`,
      name: item.properties?.name ?? `Centralina ${item.device_id}`,
      latitude: Number(item.properties?.latitude),
      longitude: Number(item.properties?.longitude),
      detectors: (item.detectors ?? []).map((d) => ({
        detector_id: d.detector_id,
        detector_code: d.detector_code ?? String(d.detector_id),
        detector_description: d.detector_description ?? "",
      })),
    }))
    .filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function excelishDateToIso(header: string): string | null {
  // headers like 1/6/2026 or 01/06/2026
  const m = header.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseFlowsCsv(csvText: string): DeviceFlow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const dateCols = headers
    .map((h, idx) => ({ idx, iso: excelishDateToIso(h) }))
    .filter((x): x is { idx: number; iso: string } => Boolean(x.iso));

  const flows: DeviceFlow[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line).map((c) => c.replace(/^"|"$/g, ""));
    const device_db = Number(cols[0]);
    const device_type = Number(cols[1]);
    const device_id = Number(cols[2]);
    const detector_id = Number(cols[3]);
    if (![device_db, device_type, device_id, detector_id].every(Number.isFinite)) continue;

    const series: FlowPoint[] = [];
    for (const { idx, iso } of dateCols) {
      const raw = cols[idx];
      if (raw === undefined || raw === "") continue;
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      series.push({ date: iso, value });
    }
    if (!series.length) continue;
    const total = series.reduce((s, p) => s + p.value, 0);
    flows.push({
      device_id,
      detector_id,
      device_db,
      device_type,
      series,
      total,
      avg: total / series.length,
    });
  }
  return flows;
}

type RawAccident = {
  "Data incidente"?: number | string;
  Latitudine?: number;
  Longitudine?: number;
  "Centro abitato"?: string;
  "Tipo di strada"?: string;
  "Caratteristiche della strada"?: string;
  "Stato fondo stradale"?: string;
  "Tipo pavimentazione"?: string;
  "Condizioni meteo"?: string;
  "Condizioni traffico"?: string;
  "Danni a cose"?: string;
  "Incidente con lesioni"?: string;
};

function excelSerialToIso(serial: number): string {
  // Excel serial date (days since 1899-12-30)
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

function parseAccidentDate(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) return excelSerialToIso(value);
  if (typeof value === "string") {
    const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
  }
  return "";
}

export function parseAccidents(jsonText: string): Accident[] {
  const raw = JSON.parse(jsonText) as RawAccident[];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const latitude = Number(row.Latitudine);
      const longitude = Number(row.Longitudine);
      return {
        date: parseAccidentDate(row["Data incidente"]),
        latitude,
        longitude,
        urban: String(row["Centro abitato"] ?? "").toLowerCase() === "si",
        roadType: row["Tipo di strada"] ?? "",
        roadFeature: row["Caratteristiche della strada"] ?? "",
        pavementState: row["Stato fondo stradale"] ?? "",
        pavementType: row["Tipo pavimentazione"] ?? "",
        weather: row["Condizioni meteo"] ?? "",
        traffic: row["Condizioni traffico"] ?? "",
        propertyDamage: String(row["Danni a cose"] ?? "").toLowerCase() === "si",
        injuries: String(row["Incidente con lesioni"] ?? "").toLowerCase() === "si",
      } satisfies Accident;
    })
    .filter(
      (a) =>
        Number.isFinite(a.latitude) &&
        Number.isFinite(a.longitude) &&
        a.latitude > 40 &&
        a.latitude < 42 &&
        a.longitude > 16 &&
        a.longitude < 18,
    );
}

export function aggregateCityDaily(flows: DeviceFlow[]): FlowPoint[] {
  const byDate = new Map<string, number>();
  for (const flow of flows) {
    for (const point of flow.series) {
      byDate.set(point.date, (byDate.get(point.date) ?? 0) + point.value);
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export function deviceTotals(flows: DeviceFlow[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const flow of flows) {
    map.set(flow.device_id, (map.get(flow.device_id) ?? 0) + flow.total);
  }
  return map;
}
