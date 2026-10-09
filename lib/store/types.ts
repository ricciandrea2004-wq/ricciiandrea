// Storage behind the API and the scraper. Two implementations: the in-memory demo store (default)
// and Supabase (when COMPETIA_STORE=supabase and its variables are set).
import type { Category, Competitor, Signal, SignalStatus, Source, SourceStatus } from "../domain";

export type Snapshot = {
  id: string;
  sourceId: string;
  fetchedAt: string;
  finalUrl: string;
  httpStatus: number;
  contentHash: string;
  title: string | null;
  text: string;
};

export type NewSource = {
  competitorId: string;
  url: string;
  category: Category;
  label: string;
  note: string;
  selector: string | null;
};

export type SourcePatch = Partial<Pick<Source, "label" | "note" | "selector" | "status">>;

export type SourceCheck = {
  status: SourceStatus;
  lastCheckedAt: string;
  lastError: string | null;
  lastObservedAt?: string;
};

export type SignalFilter = {
  status?: SignalStatus;
  category?: Category;
  competitorId?: string;
  sourceId?: string;
  since?: string;
  limit: number;
};

export type NewSignal = Omit<Signal, "id">;

export interface Store {
  readonly kind: "demo" | "supabase";
  listCompetitors(): Promise<Competitor[]>;
  getCompetitor(id: string): Promise<Competitor | null>;
  listSources(filter?: { competitorId?: string; status?: SourceStatus }): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;
  findSourceByUrl(competitorId: string, url: string): Promise<Source | null>;
  addSource(input: NewSource): Promise<Source>;
  updateSource(id: string, patch: SourcePatch): Promise<Source | null>;
  recordCheck(id: string, check: SourceCheck): Promise<void>;
  latestSnapshot(sourceId: string): Promise<Snapshot | null>;
  addSnapshot(snapshot: Omit<Snapshot, "id">): Promise<Snapshot>;
  listSignals(filter: SignalFilter): Promise<Signal[]>;
  addSignal(signal: NewSignal): Promise<Signal>;
}
