"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "it" | "en";

const DICT = {
  nav_map: { it: "Mappa", en: "Map" },
  nav_trend: { it: "Andamento", en: "Trends" },
  nav_safety: { it: "Sicurezza", en: "Safety" },
  nav_briefing: { it: "Briefing", en: "Briefing" },
  nav_live: { it: "Ora", en: "Live" },
  nav_sources: { it: "Fonti", en: "Sources" },
  nav_pitch: { it: "Per il Comune", en: "For the City" },
  nav_status: { it: "Stato", en: "Status" },
  live_buses: { it: "mezzi live", en: "live buses" },
  skip_to_content: { it: "Vai al contenuto", en: "Skip to content" },
  lang_toggle: { it: "EN", en: "IT" },
  help_title: { it: "Scorciatoie tastiera", en: "Keyboard shortcuts" },
  search_focus: { it: "Focus ricerca mappa", en: "Focus map search" },
  help_open: { it: "Apri questo aiuto", en: "Open this help" },
  onboarding_title: { it: "Benvenuto in Vista Bari", en: "Welcome to Vista Bari" },
  onboarding_body: {
    it: "Esplora mappa, andamento e briefing costruiti solo su open data comunali. Premi ? per le scorciatoie.",
    en: "Explore map, trends and briefing built only on municipal open data. Press ? for shortcuts.",
  },
  onboarding_dismiss: { it: "Ho capito", en: "Got it" },
  copy: { it: "Copia", en: "Copy" },
  copied: { it: "Copiato", en: "Copied" },
  freshness_warn: {
    it: "Sync dati oltre 7 giorni",
    en: "Data sync older than 7 days",
  },
  weather: { it: "Meteo Bari", en: "Bari weather" },
  air: { it: "Qualità aria", en: "Air quality" },
  injury_rate: { it: "Tasso lesioni", en: "Injury rate" },
  export_csv: { it: "Esporta CSV", en: "Export CSV" },
  export_json: { it: "JSON summary", en: "JSON summary" },
  fullscreen: { it: "Schermo intero", en: "Fullscreen" },
  locate: { it: "La mia posizione", en: "Locate me" },
  measure: { it: "Misura", en: "Measure" },
  legend: { it: "Legenda", en: "Legend" },
  heat: { it: "Intensità calore", en: "Heat intensity" },
  compare: { it: "Confronta", en: "Compare" },
  bookmark: { it: "Segnalibro", en: "Bookmark" },
  bookmarked: { it: "Salvata", en: "Saved" },
  opacity: { it: "Opacità layer", en: "Layer opacity" },
  min_flow: { it: "Flusso minimo", en: "Min daily flow" },
  coords: { it: "Copia coordinate", en: "Copy coordinates" },
  open_osm: { it: "Apri in OSM", en: "Open in OSM" },
  open_gmaps: { it: "Apri in Google Maps", en: "Open in Google Maps" },
} as const;

export type I18nKey = keyof typeof DICT;

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: I18nKey) => string;
};

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "vista-bari-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "it" || stored === "en") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const t = useCallback((key: I18nKey) => DICT[key][lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      lang: "it",
      setLang: () => undefined,
      t: (key) => DICT[key].it,
    };
  }
  return ctx;
}
