// Supabase store over PostgREST with the service role key, server side only. Every query is
// scoped to one organization (COMPETIA_ORGANIZATION_ID) until the API has per-user tokens.
// Needs the tables in supabase/migrations/20261010090000_sources_and_scraping.sql.
import type { Competitor, Signal, Source } from "../domain";
import type { NewCompetitor, NewSignal, NewSource, Snapshot, SignalFilter, SourceCheck, SourcePatch, Store } from "./types";

type Config = { url: string; key: string; organizationId: string };

type Row = Record<string, unknown>;

class SupabaseError extends Error {}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// PostgREST answers 400 to a malformed uuid; treat it as "not found" instead.
const isUuid = (v: string) => UUID_RE.test(v);

const SIGNAL_SELECT = "*,signal_status_changes(status,changed_at,changed_by)";

function competitorFromRow(r: Row): Competitor {
  return {
    id: String(r.id),
    name: String(r.name),
    sector: String(r.sector ?? ""),
    website: String(r.website ?? ""),
    note: String(r.note ?? ""),
  };
}

function sourceFromRow(r: Row): Source {
  return {
    id: String(r.id),
    competitorId: String(r.competitor_id),
    label: String(r.label),
    category: r.category as Source["category"],
    url: String(r.url),
    addedAt: String(r.added_at),
    lastObservedAt: String(r.last_observed_at),
    note: String(r.note ?? ""),
    status: r.status as Source["status"],
    lastCheckedAt: (r.last_checked_at as string | null) ?? null,
    lastError: (r.last_error as string | null) ?? null,
    selector: (r.selector as string | null) ?? null,
  };
}

function snapshotFromRow(r: Row): Snapshot {
  return {
    id: String(r.id),
    sourceId: String(r.source_id),
    fetchedAt: String(r.fetched_at),
    finalUrl: String(r.final_url),
    httpStatus: Number(r.http_status),
    contentHash: String(r.content_hash),
    title: (r.title as string | null) ?? null,
    text: String(r.text_content),
  };
}

function signalFromRow(r: Row): Signal {
  const changes = ((r.signal_status_changes as Row[] | undefined) ?? [])
    .map((c) => ({ status: c.status as Signal["status"], at: String(c.changed_at), by: String(c.changed_by) }))
    .sort((a, b) => a.at.localeCompare(b.at));
  return {
    id: String(r.id),
    competitorId: String(r.competitor_id),
    category: r.category as Signal["category"],
    title: String(r.title),
    before: String(r.before_value ?? ""),
    after: String(r.after_value ?? ""),
    sourceId: (r.source_id as string | null) ?? "",
    observedAt: String(r.observed_at),
    interpretation: String(r.interpretation ?? ""),
    status: r.status as Signal["status"],
    history: changes,
  };
}

export function createSupabaseStore(config: Config): Store {
  const base = `${config.url.replace(/\/$/, "")}/rest/v1`;
  const org = encodeURIComponent(config.organizationId);

  async function request(path: string, init: RequestInit = {}): Promise<Row[]> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        apikey: config.key,
        // A legacy service_role key is a JWT and also goes in Authorization; a new sb_secret_ key
        // travels only in apikey.
        ...(config.key.startsWith("eyJ") ? { Authorization: `Bearer ${config.key}` } : {}),
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new SupabaseError(`Supabase ${res.status} on ${path.split("?")[0]}`);
    }
    // With "Prefer: return=minimal" PostgREST answers 204 to a PATCH and 201 with no body to a POST.
    const body = await res.text();
    return body ? (JSON.parse(body) as Row[]) : [];
  }

  const one = (rows: Row[]) => rows[0] ?? null;

  return {
    kind: "supabase",

    async listCompetitors() {
      return (await request(`/competitors?organization_id=eq.${org}&order=name`)).map(competitorFromRow);
    },

    async getCompetitor(id) {
      if (!isUuid(id)) return null;
      const row = one(await request(`/competitors?organization_id=eq.${org}&id=eq.${encodeURIComponent(id)}`));
      return row ? competitorFromRow(row) : null;
    },

    async addCompetitor(input: NewCompetitor) {
      const rows = await request("/competitors", {
        method: "POST",
        body: JSON.stringify({
          organization_id: config.organizationId,
          name: input.name,
          sector: input.sector,
          website: input.website,
          note: input.note,
        }),
      });
      return competitorFromRow(rows[0]);
    },

    async listSources(filter = {}) {
      if (filter.competitorId && !isUuid(filter.competitorId)) return [];
      let q = `/sources?organization_id=eq.${org}&order=added_at`;
      if (filter.competitorId) q += `&competitor_id=eq.${encodeURIComponent(filter.competitorId)}`;
      if (filter.status) q += `&status=eq.${filter.status}`;
      return (await request(q)).map(sourceFromRow);
    },

    async getSource(id) {
      if (!isUuid(id)) return null;
      const row = one(await request(`/sources?organization_id=eq.${org}&id=eq.${encodeURIComponent(id)}`));
      return row ? sourceFromRow(row) : null;
    },

    async findSourceByUrl(competitorId, url) {
      if (!isUuid(competitorId)) return null;
      const row = one(
        await request(
          `/sources?organization_id=eq.${org}&competitor_id=eq.${encodeURIComponent(competitorId)}&url=eq.${encodeURIComponent(url)}`,
        ),
      );
      return row ? sourceFromRow(row) : null;
    },

    async addSource(input: NewSource) {
      const rows = await request("/sources", {
        method: "POST",
        body: JSON.stringify({
          organization_id: config.organizationId,
          competitor_id: input.competitorId,
          label: input.label,
          category: input.category,
          url: input.url,
          selector: input.selector,
          note: input.note,
        }),
      });
      return sourceFromRow(rows[0]);
    },

    async updateSource(id, patch: SourcePatch) {
      if (!isUuid(id)) return null;
      const body: Row = {};
      if (patch.label !== undefined) body.label = patch.label;
      if (patch.note !== undefined) body.note = patch.note;
      if (patch.selector !== undefined) body.selector = patch.selector;
      if (patch.status !== undefined) body.status = patch.status;
      const row = one(
        await request(`/sources?organization_id=eq.${org}&id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      );
      return row ? sourceFromRow(row) : null;
    },

    async recordCheck(id, check: SourceCheck) {
      const body: Row = {
        status: check.status,
        last_checked_at: check.lastCheckedAt,
        last_error: check.lastError,
      };
      if (check.lastObservedAt) body.last_observed_at = check.lastObservedAt;
      await request(`/sources?organization_id=eq.${org}&id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(body),
      });
    },

    async latestSnapshot(sourceId) {
      if (!isUuid(sourceId)) return null;
      const row = one(
        await request(`/source_snapshots?source_id=eq.${encodeURIComponent(sourceId)}&order=fetched_at.desc&limit=1`),
      );
      return row ? snapshotFromRow(row) : null;
    },

    async addSnapshot(snapshot) {
      const rows = await request("/source_snapshots", {
        method: "POST",
        body: JSON.stringify({
          source_id: snapshot.sourceId,
          fetched_at: snapshot.fetchedAt,
          final_url: snapshot.finalUrl,
          http_status: snapshot.httpStatus,
          content_hash: snapshot.contentHash,
          title: snapshot.title,
          text_content: snapshot.text,
        }),
      });
      return snapshotFromRow(rows[0]);
    },

    async listSignals(filter: SignalFilter) {
      if ((filter.competitorId && !isUuid(filter.competitorId)) || (filter.sourceId && !isUuid(filter.sourceId))) return [];
      let q = `/signals?select=${encodeURIComponent(SIGNAL_SELECT)}&organization_id=eq.${org}&order=observed_at.desc&limit=${filter.limit}`;
      if (filter.status) q += `&status=eq.${filter.status}`;
      if (filter.category) q += `&category=eq.${filter.category}`;
      if (filter.competitorId) q += `&competitor_id=eq.${encodeURIComponent(filter.competitorId)}`;
      if (filter.sourceId) q += `&source_id=eq.${encodeURIComponent(filter.sourceId)}`;
      if (filter.since) q += `&observed_at=gte.${encodeURIComponent(filter.since)}`;
      return (await request(q)).map(signalFromRow);
    },

    async addSignal(signal: NewSignal) {
      const rows = await request(`/signals?select=${encodeURIComponent(SIGNAL_SELECT)}`, {
        method: "POST",
        body: JSON.stringify({
          organization_id: config.organizationId,
          competitor_id: signal.competitorId,
          source_id: signal.sourceId || null,
          category: signal.category,
          title: signal.title,
          before_value: signal.before,
          after_value: signal.after,
          interpretation: signal.interpretation,
          status: signal.status,
          origin: "scraper",
          observed_at: signal.observedAt,
        }),
      });
      const saved = rows[0];
      if (signal.history.length > 0) {
        await request("/signal_status_changes", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(
            signal.history.map((h) => ({ signal_id: saved.id, status: h.status, changed_at: h.at, changed_by: h.by })),
          ),
        });
      }
      return { ...signalFromRow(saved), history: signal.history };
    },
  };
}
