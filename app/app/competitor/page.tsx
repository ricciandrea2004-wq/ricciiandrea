import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";
import { formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Competitor" };

export default async function CompetitorsPage() {
  const { competitors, organization, signalsForCompetitor, sources } = await getWorkspace();
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Competitor" }]} />
      <div className="ws-content">
        <PageHead
          icon="target"
          title="Competitor"
          description="Le aziende che il team segue."
          actions={
            <Link href="/app/competitor/nuovo" className="btn btn-primary">
              <Icon name="plus" />
              Aggiungi competitor
            </Link>
          }
        />
        {competitors.length === 0 && (
          <div className="empty">
            <strong>Nessun competitor</strong>Aggiungi la prima azienda da seguire, poi le sue pagine come fonti.
          </div>
        )}
        <div className="grid-3 ds-stagger">
          {competitors.map((c, i) => {
            const sig = signalsForCompetitor(c.id);
            const last = sig.map((s) => s.observedAt).sort().at(-1);
            const toVerify = sig.filter((s) => s.status === "to_verify").length;
            return (
              <Link key={c.id} href={`/app/competitor/${c.id}`} className="card" style={{ "--i": i } as React.CSSProperties}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="ws-org__badge" aria-hidden="true" style={{ width: 28, height: 28, fontSize: 14 }}>
                    {c.name.charAt(0)}
                  </span>
                  <strong>{c.name}</strong>
                </div>
                <p className="small muted" style={{ marginTop: 8 }}>
                  {c.sector}
                </p>
                <dl className="small" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", marginTop: 16, marginBottom: 0 }}>
                  <dt className="muted">Segnali</dt>
                  <dd className="num" style={{ margin: 0 }}>
                    {sig.length}
                    {toVerify > 0 && <span className="muted"> · {toVerify} da verificare</span>}
                  </dd>
                  <dt className="muted">Fonti</dt>
                  <dd className="num" style={{ margin: 0 }}>
                    {sources.filter((s) => s.competitorId === c.id).length}
                  </dd>
                  <dt className="muted">Ultimo segnale</dt>
                  <dd className="num" style={{ margin: 0 }}>
                    {last ? formatShortDate(last) : "—"}
                  </dd>
                </dl>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
