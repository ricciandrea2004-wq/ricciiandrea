import type { Metadata } from "next";
import MotionProvider from "@/components/motion/MotionProvider";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { PaletteEntry } from "@/components/workspace/CommandPalette";
import { briefings, competitors, organization, signals, sources } from "@/lib/demo-data";
import { categoryLabel, statusLabel } from "@/lib/domain";
import { workspaceLinks } from "@/lib/nav";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · competia.work" },
  robots: { index: false, follow: false },
};

function paletteEntries(): PaletteEntry[] {
  const nameOf = (id: string) => competitors.find((c) => c.id === id)?.name ?? "";
  return [
    { group: "Pagine", label: "Panoramica", href: "/app", icon: "home" },
    ...workspaceLinks.map((l) => ({ group: "Pagine", label: l.label, href: l.href, icon: l.icon })),
    { group: "Pagine", label: "Nuovo segnale", href: "/app/segnali/nuovo", icon: "plus" },
    { group: "Pagine", label: "Nuovo briefing", href: "/app/briefing/nuovo", icon: "plus" },
    { group: "Pagine", label: "Impostazioni", href: "/app/impostazioni/profilo", icon: "settings" },
    ...signals.map((s) => ({
      group: "Segnali",
      label: s.title,
      href: `/app/segnali/${s.id}`,
      icon: "signal" as const,
      hint: `${categoryLabel[s.category]} · ${statusLabel[s.status]}`,
    })),
    ...sources.map((s) => ({ group: "Fonti", label: s.label, href: `/app/fonti/${s.id}`, icon: "source" as const, hint: nameOf(s.competitorId) })),
    ...competitors.map((c) => ({ group: "Competitor", label: c.name, href: `/app/competitor/${c.id}`, icon: "target" as const })),
    ...briefings.map((b) => ({ group: "Briefing", label: b.title, href: `/app/briefing/${b.id}`, icon: "doc" as const })),
  ];
}

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const toVerify = signals.filter((s) => s.status === "to_verify").length;
  const user = await currentUser();
  return (
    <MotionProvider>
      <WorkspaceShell orgName={organization.name} userEmail={user?.email} toVerify={toVerify} entries={paletteEntries()}>
        <div className="demo-banner">
          Dati di esempio: il workspace non è ancora collegato al database.
        </div>
        {children}
      </WorkspaceShell>
    </MotionProvider>
  );
}
