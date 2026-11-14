import { readFile } from "node:fs/promises";
import path from "node:path";
import { deviceKey } from "./device-key";
import { getInsights as computeInsights } from "./insights";
import { aggregateCityDaily, deviceTotals } from "./parse";
import type { VistaDataBundle } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "vista-bundle.json");

export async function loadBundle(): Promise<VistaDataBundle> {
  const raw = await readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as VistaDataBundle;
}

export function getCitySeries(bundle: VistaDataBundle) {
  return aggregateCityDaily(bundle.flows);
}

export function getTopDevices(bundle: VistaDataBundle, limit = 8) {
  const totals = deviceTotals(bundle.flows);
  const byKey = new Map(bundle.centraline.map((c) => [deviceKey(c), c]));
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, total]) => ({
      key,
      total,
      centralina: byKey.get(key),
    }));
}

export function getInsights(bundle: VistaDataBundle) {
  return computeInsights(bundle);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("it-IT").format(Math.round(n));
}

export function formatDateIt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Rome",
  }).format(d);
}
