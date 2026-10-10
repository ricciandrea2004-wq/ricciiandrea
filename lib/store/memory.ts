// In-memory store seeded with the demo data. It lives as long as the server process: fine for
// local work and previews, not for production, where every function instance has its own copy.
import { randomUUID } from "node:crypto";
import { competitors, signals, sources } from "../demo-data";
import type { Competitor, Signal, Source } from "../domain";
import type { NewCompetitor, NewSignal, NewSource, Snapshot, SignalFilter, SourceCheck, SourcePatch, Store } from "./types";

type State = { competitors: Competitor[]; sources: Source[]; signals: Signal[]; snapshots: Snapshot[] };

const g = globalThis as typeof globalThis & { __competiaMemoryStore?: State };

function state(): State {
  g.__competiaMemoryStore ??= {
    competitors: structuredClone(competitors),
    sources: structuredClone(sources),
    signals: structuredClone(signals),
    snapshots: [],
  };
  return g.__competiaMemoryStore;
}

const shortId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

export const memoryStore: Store = {
  kind: "demo",

  async listCompetitors() {
    return structuredClone(state().competitors);
  },

  async getCompetitor(id) {
    return structuredClone(state().competitors.find((c) => c.id === id) ?? null);
  },

  async addCompetitor(input: NewCompetitor) {
    const competitor: Competitor = { id: shortId("cmp"), ...input };
    state().competitors.push(competitor);
    return structuredClone(competitor);
  },

  async listSources(filter = {}) {
    return state().sources.filter(
      (s) => (!filter.competitorId || s.competitorId === filter.competitorId) && (!filter.status || s.status === filter.status),
    );
  },

  async getSource(id) {
    return state().sources.find((s) => s.id === id) ?? null;
  },

  async findSourceByUrl(competitorId, url) {
    return state().sources.find((s) => s.competitorId === competitorId && s.url === url) ?? null;
  },

  async addSource(input: NewSource) {
    const now = new Date().toISOString();
    const source: Source = {
      id: shortId("src"),
      ...input,
      addedAt: now,
      lastObservedAt: now,
      status: "active",
      lastCheckedAt: null,
      lastError: null,
    };
    state().sources.push(source);
    return source;
  },

  async updateSource(id, patch: SourcePatch) {
    const source = state().sources.find((s) => s.id === id);
    if (!source) return null;
    Object.assign(source, patch);
    return source;
  },

  async recordCheck(id, check: SourceCheck) {
    const source = state().sources.find((s) => s.id === id);
    if (source) Object.assign(source, check);
  },

  async latestSnapshot(sourceId) {
    const list = state().snapshots.filter((s) => s.sourceId === sourceId);
    return list.at(-1) ?? null;
  },

  async addSnapshot(snapshot) {
    const saved = { id: shortId("snap"), ...snapshot };
    const st = state();
    st.snapshots.push(saved);
    // Keep the two most recent per source: enough to compare, bounded in memory.
    const mine = st.snapshots.filter((s) => s.sourceId === snapshot.sourceId);
    if (mine.length > 2) st.snapshots = st.snapshots.filter((s) => s !== mine[0]);
    return saved;
  },

  async listSignals(filter: SignalFilter) {
    return state()
      .signals.filter(
        (s) =>
          (!filter.status || s.status === filter.status) &&
          (!filter.category || s.category === filter.category) &&
          (!filter.competitorId || s.competitorId === filter.competitorId) &&
          (!filter.sourceId || s.sourceId === filter.sourceId) &&
          (!filter.since || s.observedAt >= filter.since),
      )
      .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
      .slice(0, filter.limit);
  },

  async addSignal(signal: NewSignal) {
    const saved: Signal = { id: shortId("s"), ...signal };
    state().signals.push(saved);
    return saved;
  },
};
