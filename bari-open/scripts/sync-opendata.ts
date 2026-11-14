import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { datasetPageUrl, downloadText, packageShow, pickLatestResource } from "../lib/ckan";
import {
  aggregateCityDaily,
  parseAccidents,
  parseCentraline,
  parseFlowsCsv,
} from "../lib/parse";
import type { DatasetMeta, VistaDataBundle } from "../lib/types";

const OUT_DIR = path.join(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "vista-bundle.json");

async function main() {
  console.log("Sync Vista Bari open data…");

  const [centralinePkg, flowsPkg, accidentsPkg] = await Promise.all([
    packageShow("centraline-semaforiche"),
    packageShow("flussi-di-traffico-giornalieri"),
    packageShow("incidenti-stradali-anno-2025"),
  ]);

  const centralineRes = pickLatestResource(centralinePkg.resources, {
    format: "JSON",
    nameIncludes: "centraline_semaforiche",
  });
  const flowsRes = pickLatestResource(flowsPkg.resources, {
    format: "CSV",
    nameIncludes: "vehiclesdaily",
  });
  const accidentsRes = pickLatestResource(accidentsPkg.resources, {
    format: "JSON",
  });

  const [centralineText, flowsText, accidentsText] = await Promise.all([
    downloadText(centralineRes.url),
    downloadText(flowsRes.url),
    downloadText(accidentsRes.url),
  ]);

  const centraline = parseCentraline(centralineText);
  const flows = parseFlowsCsv(flowsText);
  const accidents = parseAccidents(accidentsText);
  const cityDaily = aggregateCityDaily(flows);
  const cityDailyAvg =
    cityDaily.length > 0
      ? cityDaily.reduce((s, p) => s + p.value, 0) / cityDaily.length
      : 0;

  const sources: DatasetMeta[] = [
    {
      id: centralinePkg.name,
      title: centralinePkg.title,
      url: datasetPageUrl(centralinePkg.name),
      license: centralinePkg.license_title || centralinePkg.license_id || "Open data",
      resourceName: centralineRes.name,
    },
    {
      id: flowsPkg.name,
      title: flowsPkg.title,
      url: datasetPageUrl(flowsPkg.name),
      license: flowsPkg.license_title || flowsPkg.license_id || "Open data",
      resourceName: flowsRes.name,
    },
    {
      id: accidentsPkg.name,
      title: accidentsPkg.title,
      url: datasetPageUrl(accidentsPkg.name),
      license: accidentsPkg.license_title || accidentsPkg.license_id || "Open data",
      resourceName: accidentsRes.name,
    },
  ];

  const bundle: VistaDataBundle = {
    syncedAt: new Date().toISOString(),
    centraline,
    flows,
    accidents,
    sources,
    summary: {
      centralineCount: centraline.length,
      flowDays: cityDaily.length,
      accidentCount: accidents.length,
      injuryAccidents: accidents.filter((a) => a.injuries).length,
      cityDailyAvg: Math.round(cityDailyAvg),
    },
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(bundle));
  console.log(
    `Wrote ${OUT_FILE}: ${centraline.length} centraline, ${flows.length} detector series, ${accidents.length} incidenti`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
