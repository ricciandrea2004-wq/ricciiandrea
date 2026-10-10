import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { CategoryTag, StatusTag } from "@/components/SignalTags";
import CopyLinkButton from "@/components/workspace/CopyLinkButton";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";
import { formatDate, formatShortDate } from "@/lib/domain";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { getCompetitor } = await getWorkspace();
  const { id } = await params;
  return { title: getCompetitor(id)?.name ?? "Competitor" };
}

export default async function CompetitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { getCompetitor, organization, signalsForCompetitor, sources } = await getWorkspace();
  const { id } = await params;
  const competitor = getCompetitor(id);
  if (!competitor) notFound();
  const timeline = signalsForCompetitor(id).sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  const own = sources.filter((s) => s.competitorId === id);

  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Competitor", href: "/app/competitor" }, { label: competitor.name }]}>
        <CopyLinkButton />
      </Topbar>
      <article className="ws-content ws-content--doc ds-page">
        <Icon name="target" className="page-head__icon" />
        <h1 style={{ fontSize: 32 }}>{competitor.name}</h1>
        <dl className="props">
          <dt>
            <Icon name="building" />
            Settore
          </dt>
          <dd>{competitor.sector}</dd>
          <dt>
            <Icon name="link" />
            Sito
          </dt>
          <dd>
            {competitor.website ? (
              <a href={competitor.website} target="_blank" rel="noreferrer" className="link">
                {competitor.website.replace("https://", "")}
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </dd>
        </dl>
        {competitor.note && <p>{competitor.note}</p>}

        <section className="block">
          <h2 className="block-title">Linea del tempo</h2>
          {timeline.length === 0 && (
            <div className="empty">
              <strong>Ancora nessun segnale</strong>Compaiono qui quando una delle sue fonti cambia.
            </div>
          )}
          <ol className="timeline">
            {timeline.map((s) => (
              <li key={s.id}>
                <div>
                  <div className="xs muted num">{formatDate(s.observedAt)}</div>
                  <Link href={`/app/segnali/${s.id}`} style={{ fontWeight: 500 }}>
                    {s.title}
                  </Link>
                  <div className="row" style={{ gap: 4, marginTop: 4 }}>
                    <CategoryTag category={s.category} />
                    <StatusTag status={s.status} live />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="block">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="block-title">Fonti</h2>
            <Link href={`/app/fonti/nuova?competitor=${competitor.id}`} className="btn btn-secondary">
              <Icon name="plus" />
              Aggiungi fonte
            </Link>
          </div>
          <ul className="list">
            {own.map((s) => (
              <li key={s.id}>
                <Link href={`/app/fonti/${s.id}`} className="list__item">
                  <span className="list__main">
                    <strong>{s.label}</strong>
                  </span>
                  <span className="list__aside">
                    <CategoryTag category={s.category} />
                    <span className="num">{formatShortDate(s.lastObservedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
