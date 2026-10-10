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

export type NewCompetitor = Omit<Competitor, "id">;

export type NewSource = {
  competitorId: string;
  url: string;
  category: Category;
  label: string;
  note: string;
  selector: string | null;
  checkIntervalHours: number;
};

export type SourcePatch = Partial<Pick<Source, "label" | "note" | "selector" | "status" | "checkIntervalHours">>;

export type SourceCheck = {
  status: SourceStatus;
  lastCheckedAt: string;
  lastError: string | null;
  failureCount: number;
  lastObservedAt?: string;
};

export type CheckOutcome = "baseline" | "unchanged" | "changed" | "blocked" | "error";

// One page read inside a run, kept as history (and as the error log) in source_checks.
export type SourceCheckLog = {
  sourceId: string;
  checkedAt: string;
  outcome: CheckOutcome;
  message: string | null;
  signalId: string | null;
  durationMs: number;
};

export type RunTrigger = "cron" | "manual";

export type ScrapeRunRecord = {
  trigger: RunTrigger;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  // Sources due when the run started; the ones not reached wait for the next run.
  due: number;
  checked: number;
  changed: number;
  failed: number;
};

export type ScrapeRunSummary = ScrapeRunRecord & { id: string };

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
  addCompetitor(input: NewCompetitor): Promise<Competitor>;
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
  recordRun(run: ScrapeRunRecord, checks: SourceCheckLog[]): Promise<string>;
  listRuns(limit: number): Promise<ScrapeRunSummary[]>;
  getRun(id: string): Promise<(ScrapeRunSummary & { checks: SourceCheckLog[] }) | null>;
  listChecks(sourceId: string, limit: number): Promise<SourceCheckLog[]>;
  // Drops old snapshots and check history. Safe to skip: it only bounds storage.
  pruneHistory(): Promise<void>;
}
