import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTag } from "@/components/SignalTags";
import Icon from "@/components/Icon";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";
import { formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Fonti" };

export default async function SourcesPage() {
  const { getCompetitor, organization, signalsForSource, sources } = await getWorkspace();
  const rows = [...sources].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt));
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Fonti" }]} />
      <div className="ws-content">
        <PageHead
          icon="source"
          title="Fonti"
          description="Le pagine pubbliche che il team osserva. Ogni segnale ne cita una."
          actions={
            <Link href="/app/fonti/nuova" className="btn btn-primary">
              <Icon name="plus" />
              Nuova fonte
            </Link>
          }
        />
        {rows.length === 0 ? (
          <div className="empty">
            <strong>Nessuna fonte</strong>Aggiungi una pagina pubblica di un competitor: la controlliamo ogni mattina.
          </div>
        ) : (
        <div className="table-wrap ds-page">
          <table className="db-table">
            <thead>
              <tr>
                <th scope="col">Fonte</th>
                <th scope="col">Competitor</th>
                <th scope="col">Categoria</th>
                <th scope="col">Segnali</th>
                <th scope="col">Ultima osservazione</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="title-cell">
                    <Link href={`/app/fonti/${s.id}`}>{s.label}</Link>
                    <div className="xs muted" style={{ overflowWrap: "anywhere" }}>
                      {s.url}
                    </div>
                  </td>
                  <td className="nowrap">{getCompetitor(s.competitorId)?.name}</td>
                  <td>
                    <CategoryTag category={s.category} />
                  </td>
                  <td className="num">{signalsForSource(s.id).length}</td>
                  <td className="nowrap num">{formatShortDate(s.lastObservedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="db-foot">{rows.length} fonti</div>
        </div>
        )}
      </div>
    </>
  );
}
