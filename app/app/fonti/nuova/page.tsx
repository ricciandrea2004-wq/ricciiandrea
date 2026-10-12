import type { Metadata } from "next";
import Link from "next/link";
import { SourceForm } from "@/components/workspace/DataForms";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";

export const metadata: Metadata = { title: "Nuova fonte" };
// Saving a source also reads the page once.
export const maxDuration = 60;

export default async function NewSourcePage({ searchParams }: { searchParams: Promise<{ competitor?: string }> }) {
  const { competitor } = await searchParams;
  const { organization, competitors } = await getWorkspace();
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Fonti", href: "/app/fonti" }, { label: "Nuova fonte" }]} />
      <div className="ws-content ws-content--doc">
        <PageHead eyebrow="Fonti"
          icon="plus"
          title="Nuova fonte"
          description="Una pagina pubblica da controllare ogni giorno. Quando cambia, nasce un segnale da verificare."
        />
        {competitors.length === 0 ? (
          <div className="empty">
            <strong>Prima aggiungi un competitor</strong>
            <Link href="/app/competitor/nuovo" className="link">
              Aggiungi competitor
            </Link>
          </div>
        ) : (
          <SourceForm competitors={competitors} competitorId={competitors.some((c) => c.id === competitor) ? competitor : undefined} />
        )}
      </div>
    </>
  );
}
