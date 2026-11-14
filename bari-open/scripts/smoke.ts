import { readFile } from "node:fs/promises";
import path from "node:path";
import { deviceKey } from "../lib/device-key";
import { getInsights } from "../lib/data";
import type { VistaDataBundle } from "../lib/types";

async function main() {
  const file = path.join(process.cwd(), "data", "vista-bundle.json");
  const bundle = JSON.parse(await readFile(file, "utf8")) as VistaDataBundle;
  const insights = getInsights(bundle);

  const centralinaKeys = bundle.centraline.map((c) => deviceKey(c));
  const flowDeviceKeys = [
    ...new Set(bundle.flows.map((f) => deviceKey(f))),
  ];

  const checks: Array<[string, boolean]> = [
    ["syncedAt", Boolean(bundle.syncedAt)],
    ["centraline >= 50", bundle.centraline.length >= 50],
    ["flows > 0", bundle.flows.length > 0],
    ["accidents > 100", bundle.accidents.length > 100],
    ["sources >= 3", bundle.sources.length >= 3],
    [
      "flowDays >= 60 OR flowMonths >= 3",
      bundle.summary.flowDays >= 60 || (bundle.summary.flowMonths ?? 0) >= 3,
    ],
    ["summary.flowMonths defined", typeof bundle.summary.flowMonths === "number"],
    [
      "centraline have coords",
      bundle.centraline.every((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)),
    ],
    [
      "composite device keys unique",
      new Set(centralinaKeys).size === bundle.centraline.length,
    ],
    [
      "flow device keys use composite form",
      flowDeviceKeys.every((k) => /^\d+:\d+:\d+$/.test(k)),
    ],
    ["insights.trafficAnomalies is array", Array.isArray(insights.trafficAnomalies)],
    ["insights.safetyHotspots is array", Array.isArray(insights.safetyHotspots)],
    [
      "insights.briefingFindings == 5",
      Array.isArray(insights.briefingFindings) && insights.briefingFindings.length === 5,
    ],
    [
      "sample accident in Bari bbox",
      bundle.accidents.slice(0, 20).every(
        (a) =>
          a.latitude > 40.9 &&
          a.latitude < 41.3 &&
          a.longitude > 16.6 &&
          a.longitude < 17.1,
      ),
    ],
  ];

  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "OK" : "FAIL"}  ${name}`);
    if (!ok) failed += 1;
  }

  if (failed) {
    console.error(`Smoke failed: ${failed} checks`);
    process.exit(1);
  }
  console.log(
    `Smoke OK — ${bundle.centraline.length} centraline, ${bundle.flows.length} series, ${bundle.summary.flowDays} days / ${bundle.summary.flowMonths} months, ${bundle.accidents.length} incidenti, anomalies=${insights.trafficAnomalies.length}, hotspots=${insights.safetyHotspots.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
