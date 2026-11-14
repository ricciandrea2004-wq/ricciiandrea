const CKAN_BASE = "https://opendata.comune.bari.it/api/3/action";
const UA =
  "Mozilla/5.0 (compatible; VistaBari/0.1; +https://github.com/ricciandrea2004-wq/ricciiandrea)";

export type CkanResource = {
  id: string;
  name: string;
  format: string;
  url: string;
  last_modified?: string | null;
  created?: string;
};

export type CkanPackage = {
  id: string;
  name: string;
  title: string;
  notes?: string;
  license_title?: string;
  license_id?: string;
  resources: CkanResource[];
};

async function ckanAction<T>(action: string, query: Record<string, string>): Promise<T> {
  const url = new URL(`${CKAN_BASE}/${action}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`CKAN ${action} failed: ${res.status}`);
  const body = (await res.json()) as { success: boolean; result: T; error?: unknown };
  if (!body.success) throw new Error(`CKAN ${action} unsuccessful`);
  return body.result;
}

export async function packageShow(id: string): Promise<CkanPackage> {
  return ckanAction<CkanPackage>("package_show", { id });
}

export type PackageSearchResult = {
  count: number;
  results: CkanPackage[];
};

export async function packageSearch(
  q: string,
  rows = 10,
): Promise<PackageSearchResult> {
  return ckanAction<PackageSearchResult>("package_search", {
    q,
    rows: String(rows),
  });
}

export async function downloadText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  return res.text();
}

function filterResources(
  resources: CkanResource[],
  opts: { format?: string; nameIncludes?: string } = {},
): CkanResource[] {
  return resources.filter((r) => {
    if (opts.format && r.format.toUpperCase() !== opts.format.toUpperCase()) return false;
    if (opts.nameIncludes && !r.name.toLowerCase().includes(opts.nameIncludes.toLowerCase())) {
      return false;
    }
    return Boolean(r.url);
  });
}

function sortResourcesNewestFirst(resources: CkanResource[]): CkanResource[] {
  return [...resources].sort((a, b) => {
    const ta = Date.parse(a.last_modified || a.created || "") || 0;
    const tb = Date.parse(b.last_modified || b.created || "") || 0;
    if (tb !== ta) return tb - ta;
    return b.name.localeCompare(a.name);
  });
}

export function pickLatestResource(
  resources: CkanResource[],
  opts: { format?: string; nameIncludes?: string } = {},
): CkanResource {
  const filtered = filterResources(resources, opts);
  if (!filtered.length) throw new Error("No matching CKAN resource");
  return sortResourcesNewestFirst(filtered)[0];
}

/** Newest-first slice of matching resources (e.g. last N monthly CSVs). */
export function pickLatestResources(
  resources: CkanResource[],
  limit: number,
  opts: { format?: string; nameIncludes?: string } = {},
): CkanResource[] {
  const filtered = filterResources(resources, opts);
  if (!filtered.length) throw new Error("No matching CKAN resource");
  return sortResourcesNewestFirst(filtered).slice(0, limit);
}

export function datasetPageUrl(packageName: string): string {
  return `https://opendata.comune.bari.it/dataset/${packageName}`;
}
