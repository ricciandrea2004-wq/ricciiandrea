import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import AddCompetitor, { ADD_COMPETITOR_ID } from "@/components/workspace/AddCompetitor";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { competitors, organization, signalsForCompetitor, sources } from "@/lib/demo-data";
import { formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Competitor" };

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default function CompetitorsPage() {
  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Competitor" }]} />
      <div className="ws-content">
        <PageHead
          icon="target"
          title="Competitor"
          eyebrow={`${competitors.length} seguiti`}
          description="Le aziende che il team segue. Per aggiungerne una basta il link del suo sito."
          actions={
            <a href={`#${ADD_COMPETITOR_ID}`} className="btn btn-primary">
              <Icon name="plus" />
              Aggiungi competitor
            </a>
          }
        />
        <AddCompetitor />
        <h2 className="block-title block">Seguiti dal team</h2>
        <div className="grid-3 ds-stagger">
          {competitors.map((c, i) => {
            const sig = signalsForCompetitor(c.id);
            const last = sig.map((s) => s.observedAt).sort().at(-1);
            const toVerify = sig.filter((s) => s.status === "to_verify").length;
            return (
              <Link key={c.id} href={`/app/competitor/${c.id}`} className="card comp-card" style={{ "--i": i } as React.CSSProperties}>
                <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                  <span className="comp-card__badge" aria-hidden="true">
                    {c.name.charAt(0)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3>{c.name}</h3>
                    {c.sector && <p className="small muted">{c.sector}</p>}
                  </div>
                </div>
                {c.website && (
                  <span className="comp-card__site">
                    <Icon name="link" />
                    {hostOf(c.website)}
                  </span>
                )}
                <dl className="comp-card__facts">
                  <div>
                    <dt>Segnali</dt>
                    <dd>{sig.length}</dd>
                  </div>
                  <div>
                    <dt>Fonti</dt>
                    <dd>{sources.filter((s) => s.competitorId === c.id).length}</dd>
                  </div>
                  <div>
                    <dt>Ultimo</dt>
                    <dd>{last ? formatShortDate(last) : "—"}</dd>
                  </div>
                </dl>
                {toVerify > 0 && <p className="comp-card__note">{toVerify} da verificare</p>}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
