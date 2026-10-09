import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { CategoryTag, StatusTag } from "@/components/SignalTags";
import CopyLinkButton from "@/components/workspace/CopyLinkButton";
import Topbar from "@/components/workspace/Topbar";
import { getCompetitor, getSource, organization, signalsForSource, sources } from "@/lib/demo-data";
import Tag from "@/components/Tag";
import { formatDate, formatShortDate, sourceStatusColor, sourceStatusLabel } from "@/lib/domain";

export function generateStaticParams() {
  return sources.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getSource(id)?.label ?? "Fonte" };
}

export default async function SourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getSource(id);
  if (!source) notFound();
  const competitor = getCompetitor(source.competitorId);
  const related = signalsForSource(source.id);

  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Fonti", href: "/app/fonti" }, { label: source.label }]}>
        <CopyLinkButton />
      </Topbar>
      <article className="ws-content ws-content--doc ds-page">
        <Icon name="source" className="page-head__icon" />
        <h1 style={{ fontSize: 32 }}>{source.label}</h1>
        <dl className="props">
          <dt>
            <Icon name="target" />
            Competitor
          </dt>
          <dd>
            <Link href={`/app/competitor/${source.competitorId}`} className="link">
              {competitor?.name}
            </Link>
          </dd>
          <dt>
            <Icon name="tag" />
            Categoria
          </dt>
          <dd>
            <CategoryTag category={source.category} />
          </dd>
          <dt>
            <Icon name="link" />
            Indirizzo
          </dt>
          <dd>
            <a href={source.url} target="_blank" rel="noreferrer" className="link">
              {source.url}
            </a>
          </dd>
          <dt>
            <Icon name="calendar" />
            Aggiunta
          </dt>
          <dd>{formatDate(source.addedAt)}</dd>
          <dt>
            <Icon name="clock" />
            Ultima osservazione
          </dt>
          <dd>{formatDate(source.lastObservedAt)}</dd>
          <dt>
            <Icon name="clock" />
            Controllo automatico
          </dt>
          <dd>
            <Tag color={sourceStatusColor[source.status]}>{sourceStatusLabel[source.status]}</Tag>
            {source.lastCheckedAt && <span className="num"> · {formatDate(source.lastCheckedAt)}</span>}
            {source.lastError && <span> · {source.lastError}</span>}
          </dd>
        </dl>

        {source.note && (
          <section>
            <h2 className="block-title">Note</h2>
            <p>{source.note}</p>
          </section>
        )}

        <section className="block">
          <h2 className="block-title">Segnali da questa fonte</h2>
          {related.length === 0 ? (
            <div className="empty">
              <strong>Ancora nessun segnale</strong>Quando registri un cambiamento da questa pagina, compare qui.
            </div>
          ) : (
            <ul className="list">
              {related.map((s) => (
                <li key={s.id}>
                  <Link href={`/app/segnali/${s.id}`} className="list__item">
                    <span className="list__main">
                      <strong>{s.title}</strong>
                    </span>
                    <span className="list__aside">
                      <StatusTag status={s.status} live />
                      <span className="num">{formatShortDate(s.observedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </>
  );
}
