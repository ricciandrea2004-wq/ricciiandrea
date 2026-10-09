import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { CategoryTag, StatusTag } from "@/components/SignalTags";
import PriceDelta from "@/components/motion/PriceDelta";
import CopyLinkButton from "@/components/workspace/CopyLinkButton";
import DemoAction from "@/components/workspace/DemoAction";
import Topbar from "@/components/workspace/Topbar";
import { briefingsForSignal, getCompetitor, getSignal, getSource, organization, signals } from "@/lib/demo-data";
import { formatDate } from "@/lib/domain";

export function generateStaticParams() {
  return signals.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getSignal(id)?.title ?? "Segnale" };
}

export default async function SignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = getSignal(id);
  if (!signal) notFound();
  const competitor = getCompetitor(signal.competitorId);
  const source = getSource(signal.sourceId);
  const usedIn = briefingsForSignal(signal.id);
  const history = [...signal.history].reverse();

  return (
    <>
      <Topbar
        crumbs={[
          { label: organization.name, href: "/app" },
          { label: "Segnali", href: "/app/segnali" },
          { label: signal.title },
        ]}
      >
        <CopyLinkButton />
        <DemoAction label="Altre azioni" icon="dots" iconOnly />
      </Topbar>
      <article className="ws-content ws-content--doc ds-page">
        <Icon name="signal" className="page-head__icon" />
        <h1 style={{ fontSize: 32 }}>{signal.title}</h1>

        <dl className="props">
          <dt>
            <Icon name="status" />
            Stato
          </dt>
          <dd>
            <StatusTag status={signal.status} />
          </dd>
          <dt>
            <Icon name="tag" />
            Categoria
          </dt>
          <dd>
            <CategoryTag category={signal.category} />
          </dd>
          <dt>
            <Icon name="target" />
            Competitor
          </dt>
          <dd>
            <Link href={`/app/competitor/${signal.competitorId}`} className="link">
              {competitor?.name}
            </Link>
          </dd>
          <dt>
            <Icon name="source" />
            Fonte
          </dt>
          <dd>
            <Link href={`/app/fonti/${signal.sourceId}`} className="link">
              {source?.label}
            </Link>
          </dd>
          <dt>
            <Icon name="calendar" />
            Osservato
          </dt>
          <dd>{formatDate(signal.observedAt)}</dd>
          <dt>
            <Icon name="doc" />
            Briefing
          </dt>
          <dd>
            {usedIn.length === 0 ? (
              <span className="muted">Nessuno</span>
            ) : (
              usedIn.map((b) => (
                <Link key={b.id} href={`/app/briefing/${b.id}`} className="link">
                  {b.title}
                </Link>
              ))
            )}
          </dd>
        </dl>

        <div className="row" style={{ marginBottom: 32 }}>
          {signal.status === "to_verify" && (
            <>
              <DemoAction label="Segna come verificato" icon="check" variant="primary" />
              <DemoAction label="Scarta" variant="ghost" />
            </>
          )}
          {signal.status === "verified" && <DemoAction label="Aggiungi al briefing" icon="plus" variant="primary" />}
          {source && (
            <a href={source.url} target="_blank" rel="noreferrer" className="btn btn-secondary">
              <Icon name="external" />
              Apri la fonte
            </a>
          )}
        </div>

        <PriceDelta before={signal.before} after={signal.after} style={{ marginTop: 0 }} />

        <section className="block">
          <h2 className="block-title">Interpretazione</h2>
          <p>{signal.interpretation}</p>
        </section>

        {source && (
          <section className="block">
            <h2 className="block-title">Fonte</h2>
            <div className="card">
              <strong>{source.label}</strong>
              <p className="small muted" style={{ marginTop: 4, overflowWrap: "anywhere" }}>
                {source.url}
              </p>
              {source.note && (
                <p className="small" style={{ marginTop: 12 }}>
                  {source.note}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="block">
          <h2 className="block-title">Storico</h2>
          <ol className="timeline">
            {history.map((h, i) => (
              <li key={i}>
                <span>
                  <StatusTag status={h.status} /> <span className="muted">da</span> {h.by}
                  <span className="xs muted"> · {formatDate(h.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="block">
          <h2 className="block-title">Commenti</h2>
          <div className="field">
            <label htmlFor="comment" className="visually-hidden">
              Aggiungi un commento
            </label>
            <textarea id="comment" className="textarea" placeholder="Aggiungi un commento…" />
          </div>
          <div style={{ marginTop: 8 }}>
            <DemoAction label="Commenta" />
          </div>
        </section>
      </article>
    </>
  );
}
