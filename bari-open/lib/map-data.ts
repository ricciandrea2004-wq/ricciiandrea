import type { Accident, Centralina, DeviceFlow, FlowPoint } from "./types";

export type DeviceFlowSummary = {
  device_id: number;
  total: number;
  series: FlowPoint[];
};

export function summarizeFlowsByDevice(flows: DeviceFlow[]): DeviceFlowSummary[] {
  const map = new Map<number, { total: number; byDate: Map<string, number> }>();
  for (const f of flows) {
    const prev = map.get(f.device_id) ?? { total: 0, byDate: new Map() };
    prev.total += f.total;
    for (const p of f.series) {
      prev.byDate.set(p.date, (prev.byDate.get(p.date) ?? 0) + p.value);
    }
    map.set(f.device_id, prev);
  }
  return [...map.entries()].map(([device_id, v]) => ({
    device_id,
    total: v.total,
    series: [...v.byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value })),
  }));
}

export type MapPayload = {
  centraline: Centralina[];
  deviceFlows: DeviceFlowSummary[];
  accidents?: Array<
    Pick<Accident, "date" | "latitude" | "longitude" | "roadType" | "weather" | "injuries">
  >;
};

export function toMapPayload(
  centraline: Centralina[],
  flows: DeviceFlow[],
  accidents?: Accident[],
): MapPayload {
  return {
    centraline,
    deviceFlows: summarizeFlowsByDevice(flows),
    accidents: accidents?.map((a) => ({
      date: a.date,
      latitude: a.latitude,
      longitude: a.longitude,
      roadType: a.roadType,
      weather: a.weather,
      injuries: a.injuries,
    })),
  };
}
