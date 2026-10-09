import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTag } from "@/components/SignalTags";
import DemoAction from "@/components/workspace/DemoAction";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getCompetitor, organization, signalsForSource, sources } from "@/lib/demo-data";
import { formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Fonti" };

export default function SourcesPage() {
  const rows = [...sources].sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt));
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Fonti" }]} />
      <div className="ws-content">
        <PageHead
          icon="source"
          title="Fonti"
          description="Le pagine pubbliche che il team osserva. Ogni segnale ne cita una."
          actions={<DemoAction label="Nuova fonte" icon="plus" variant="primary" />}
        />
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
      </div>
    </>
  );
}
