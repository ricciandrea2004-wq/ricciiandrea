import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  datasetPageUrl,
  downloadText,
  packageSearch,
  packageShow,
  pickLatestResource,
  pickLatestResources,
  type CkanPackage,
  type CkanResource,
} from "../lib/ckan";
import { simplifyFeatureCollection } from "../lib/geo";
import {
  aggregateCityDaily,
  countFlowMonths,
  mergeFlows,
  parseAccidents,
  parseCentraline,
  parseFlowsCsv,
} from "../lib/parse";
import type { DatasetMeta, DistrictFeatureCollection, VistaDataBundle } from "../lib/types";

const OUT_DIR = path.join(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "vista-bundle.json");
const FLOW_MONTHS = 6;

function looksLikeGeoJson(resource: CkanResource): boolean {
  const fmt = resource.format.toUpperCase();
  const name = resource.name.toLowerCase();
  const url = resource.url.toLowerCase();
  return (
    fmt === "GEOJSON" ||
    (fmt === "JSON" && (name.includes("geojson") || url.includes(".geojson"))) ||
    name.endsWith(".geojson") ||
    url.includes(".geojson")
  );
}

function isDistrictPackage(pkg: CkanPackage): boolean {
  const hay = `${pkg.name} ${pkg.title}`.toLowerCase();
  return (
    hay.includes("circoscrizioni") ||
    hay.includes("circorscrizioni") ||
    hay.includes("municipi")
  );
}

async function tryFetchDistricts(): Promise<{
  districts?: DistrictFeatureCollection;
  source?: DatasetMeta;
}> {
  try {
    const search = await packageSearch("circoscrizioni", 12);
    const candidates = (search.results ?? []).filter(isDistrictPackage);

    for (const pkg of candidates) {
      const geoResources = (pkg.resources ?? []).filter(looksLikeGeoJson);
      if (!geoResources.length) continue;
      const res = pickLatestResource(geoResources);
      const text = await downloadText(res.url);
      const parsed = JSON.parse(text) as DistrictFeatureCollection;
      if (parsed?.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
        continue;
      }
      const districts = simplifyFeatureCollection(parsed, 4);
      return {
        districts,
        source: {
          id: pkg.name,
          title: pkg.title,
          url: datasetPageUrl(pkg.name),
          license: pkg.license_title || pkg.license_id || "Open data",
          resourceName: res.name,
        },
      };
    }
    console.log("Districts: nessun GeoJSON circoscrizioni/municipi su CKAN (solo ZIP/shape).");
  } catch (err) {
    console.warn("Districts: skip —", err instanceof Error ? err.message : err);
  }
  return {};
}

async function main() {
  console.log("Sync Vista Bari open data…");

  const [centralinePkg, flowsPkg, accidentsPkg, accidents2024Pkg, districtAttempt] =
    await Promise.all([
      packageShow("centraline-semaforiche"),
      packageShow("flussi-di-traffico-giornalieri"),
      packageShow("incidenti-stradali-anno-2025"),
      packageShow("incidenti-stradali-anno-2024").catch(() => null),
      tryFetchDistricts(),
    ]);

  const centralineRes = pickLatestResource(centralinePkg.resources, {
    format: "JSON",
    nameIncludes: "centraline_semaforiche",
  });
  const flowsResources = pickLatestResources(flowsPkg.resources, FLOW_MONTHS, {
    format: "CSV",
    nameIncludes: "vehiclesdaily",
  });
  const accidentsRes = pickLatestResource(accidentsPkg.resources, {
    format: "JSON",
  });

  console.log(
    `Flows: downloading ${flowsResources.length} monthly CSV — ${flowsResources.map((r) => r.name).join(", ")}`,
  );

  let accidents2024Text: string | null = null;
  let accidents2024Res: CkanResource | null = null;
  if (accidents2024Pkg) {
    try {
      accidents2024Res = pickLatestResource(accidents2024Pkg.resources, { format: "JSON" });
    } catch (err) {
      console.warn("Accidents 2024: skip resource —", err instanceof Error ? err.message : err);
    }
  } else {
    console.log("Accidents 2024: package non trovato su CKAN — toggle multi-anno userà solo 2025.");
  }

  const [centralineText, accidentsText, accidents2024Download, ...flowsTexts] = await Promise.all([
    downloadText(centralineRes.url),
    downloadText(accidentsRes.url),
    accidents2024Res
      ? downloadText(accidents2024Res.url).catch((err) => {
          console.warn("Accidents 2024 download failed:", err instanceof Error ? err.message : err);
          return null;
        })
      : Promise.resolve(null),
    ...flowsResources.map((r) => downloadText(r.url)),
  ]);
  accidents2024Text = accidents2024Download;

  const centraline = parseCentraline(centralineText);
  const flowBatches = flowsTexts.map((text) => parseFlowsCsv(text));
  const flows = mergeFlows(flowBatches);
  const accidents2025 = parseAccidents(accidentsText);
  const accidentsPrior = accidents2024Text ? parseAccidents(accidents2024Text) : [];
  const accidents = [...accidentsPrior, ...accidents2025];
  if (accidentsPrior.length) {
    console.log(`Accidents: merged ${accidentsPrior.length} (2024) + ${accidents2025.length} (2025)`);
  }
  const cityDaily = aggregateCityDaily(flows);
  const flowMonths = countFlowMonths(flows);
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
      resourceName: flowsResources.map((r) => r.name).join(", "),
    },
    {
      id: accidentsPkg.name,
      title: accidentsPkg.title,
      url: datasetPageUrl(accidentsPkg.name),
      license: accidentsPkg.license_title || accidentsPkg.license_id || "Open data",
      resourceName: accidentsRes.name,
    },
  ];
  if (accidents2024Pkg && accidents2024Res) {
    sources.push({
      id: accidents2024Pkg.name,
      title: accidents2024Pkg.title,
      url: datasetPageUrl(accidents2024Pkg.name),
      license: accidents2024Pkg.license_title || accidents2024Pkg.license_id || "Open data",
      resourceName: accidents2024Res.name,
    });
  }
  if (districtAttempt.source) sources.push(districtAttempt.source);

  const bundle: VistaDataBundle = {
    syncedAt: new Date().toISOString(),
    centraline,
    flows,
    accidents,
    sources,
    ...(districtAttempt.districts ? { districts: districtAttempt.districts } : {}),
    summary: {
      centralineCount: centraline.length,
      flowDays: cityDaily.length,
      flowMonths,
      accidentCount: accidents.length,
      injuryAccidents: accidents.filter((a) => a.injuries).length,
      cityDailyAvg: Math.round(cityDailyAvg),
      flowResourceNames: flowsResources.map((r) => r.name),
    },
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(bundle));
  console.log(
    `Wrote ${OUT_FILE}: ${centraline.length} centraline, ${flows.length} detector series, ${cityDaily.length} days / ${flowMonths} months, ${accidents.length} incidenti` +
      (bundle.districts ? `, ${bundle.districts.features.length} districts` : ""),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
