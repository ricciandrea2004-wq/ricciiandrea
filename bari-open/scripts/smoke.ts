import { readFile } from "node:fs/promises";
import path from "node:path";
import type { VistaDataBundle } from "../lib/types";

async function main() {
  const file = path.join(process.cwd(), "data", "vista-bundle.json");
  const bundle = JSON.parse(await readFile(file, "utf8")) as VistaDataBundle;

  const checks: Array<[string, boolean]> = [
    ["syncedAt", Boolean(bundle.syncedAt)],
    ["centraline >= 50", bundle.centraline.length >= 50],
    ["flows > 0", bundle.flows.length > 0],
    ["accidents > 100", bundle.accidents.length > 100],
    ["sources == 3", bundle.sources.length === 3],
    [
      "centraline have coords",
      bundle.centraline.every((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude)),
    ],
    [
      "sample accident in Bari bbox",
      bundle.accidents.slice(0, 20).every(
        (a) => a.latitude > 40.9 && a.latitude < 41.3 && a.longitude > 16.6 && a.longitude < 17.1,
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
    `Smoke OK — ${bundle.centraline.length} centraline, ${bundle.flows.length} series, ${bundle.accidents.length} incidenti`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
