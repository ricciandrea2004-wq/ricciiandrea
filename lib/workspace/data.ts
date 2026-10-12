// Data for the workspace pages (/app). With COMPETIA_STORE=supabase it reads the real competitors,
// sources and signals through getStore() (the same store as the API and the daily scrape); without
// it, or when a variable is missing, it shows the demo data and says why in the banner.
// Briefings and members are not in the database yet: empty in live mode.
import { cache } from "react";
import * as demo from "@/lib/demo-data";
import type { Briefing, Competitor, Member, Signal, Source } from "@/lib/domain";
import { getStore, StoreConfigError } from "@/lib/store";

export type Workspace = {
  /** True when the data comes from the database. */
  live: boolean;
  /** Why the demo data is shown, when it is. */
  notice: string | null;
  organization: { name: string; slug: string };
  competitors: Competitor[];
  sources: Source[];
  signals: Signal[];
  briefings: Briefing[];
  members: Member[];
  getCompetitor(id: string): Competitor | undefined;
  getSource(id: string): Source | undefined;
  getSignal(id: string): Signal | undefined;
  getBriefing(id: string): Briefing | undefined;
  signalsForSource(id: string): Signal[];
  signalsForCompetitor(id: string): Signal[];
  briefingsForSignal(id: string): Briefing[];
};

const SIGNAL_LIMIT = 500;

function build(base: Omit<Workspace, "getCompetitor" | "getSource" | "getSignal" | "getBriefing" | "signalsForSource" | "signalsForCompetitor" | "briefingsForSignal">): Workspace {
  return {
    ...base,
    getCompetitor: (id) => base.competitors.find((c) => c.id === id),
    getSource: (id) => base.sources.find((s) => s.id === id),
    getSignal: (id) => base.signals.find((s) => s.id === id),
    getBriefing: (id) => base.briefings.find((b) => b.id === id),
    signalsForSource: (id) => base.signals.filter((s) => s.sourceId === id),
    signalsForCompetitor: (id) => base.signals.filter((s) => s.competitorId === id),
    briefingsForSignal: (id) => base.briefings.filter((b) => b.signalIds.includes(id)),
  };
}

function demoWorkspace(notice: string): Workspace {
  return build({
    live: false,
    notice,
    organization: demo.organization,
    competitors: demo.competitors,
    sources: demo.sources,
    signals: demo.signals,
    briefings: demo.briefings,
    members: demo.members,
  });
}

/** One read per request, shared by the layout and the page. */
export const getWorkspace = cache(async (): Promise<Workspace> => {
  if (process.env.COMPETIA_STORE !== "supabase") {
    return demoWorkspace("Dati di esempio: il workspace non è collegato al database (COMPETIA_STORE).");
  }
  try {
    const store = getStore();
    const [competitors, sources, signals] = await Promise.all([
      store.listCompetitors(),
      store.listSources(),
      store.listSignals({ limit: SIGNAL_LIMIT }),
    ]);
    return build({
      live: true,
      notice: null,
      organization: { name: process.env.COMPETIA_ORGANIZATION_NAME || "Competia", slug: "competia" },
      competitors,
      sources,
      signals,
      briefings: [],
      members: [],
    });
  } catch (err) {
    if (err instanceof StoreConfigError) return demoWorkspace(`Dati di esempio: per i dati veri manca ${err.missing.join(", ")}.`);
    console.error("[workspace] lettura dal database non riuscita", err);
    return demoWorkspace("Dati di esempio: il database non ha risposto. Riprova tra poco.");
  }
});
