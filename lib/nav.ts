import type { IconName } from "@/components/Icon";

export type NavLink = { href: string; label: string; description?: string; icon?: IconName };

export const productLinks: NavLink[] = [
  { href: "/prodotto", label: "Panoramica", description: "Dalla fonte al briefing", icon: "layers" },
  { href: "/prodotto/segnali", label: "Segnali", description: "Prezzo, assortimento, promozioni", icon: "signal" },
  { href: "/prodotto/fonti", label: "Fonti", description: "Ogni dato con la sua pagina", icon: "source" },
  { href: "/prodotto/briefing", label: "Briefing", description: "Documenti che si possono verificare", icon: "doc" },
];

// "Per chi" and "Prezzi" are not in the navigation until Andrea decides their phase.
export const headerLinks: NavLink[] = [
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/contatti", label: "Contatti" },
];

export const footerGroups: { title: string; links: NavLink[] }[] = [
  { title: "Prodotto", links: productLinks.slice(1) },
  {
    title: "Azienda",
    links: [
      { href: "/chi-siamo", label: "Chi siamo" },
      { href: "/contatti", label: "Contatti" },
      { href: "/richiedi-accesso", label: "Richiedi accesso" },
    ],
  },
  {
    title: "Legale",
    links: [
      { href: "/legale/privacy", label: "Privacy" },
      { href: "/legale/cookie", label: "Cookie" },
      { href: "/legale/termini", label: "Termini di servizio" },
    ],
  },
];

export const workspaceLinks: (NavLink & { icon: IconName })[] = [
  { href: "/app/segnali", label: "Segnali", icon: "signal" },
  { href: "/app/fonti", label: "Fonti", icon: "source" },
  { href: "/app/competitor", label: "Competitor", icon: "target" },
  { href: "/app/briefing", label: "Briefing", icon: "doc" },
];
