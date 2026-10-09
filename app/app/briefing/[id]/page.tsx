import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { CategoryTag } from "@/components/SignalTags";
import Tag from "@/components/Tag";
import CopyLinkButton from "@/components/workspace/CopyLinkButton";
import DemoAction from "@/components/workspace/DemoAction";
import PrintButton from "@/components/workspace/PrintButton";
import Topbar from "@/components/workspace/Topbar";
import { briefings, getBriefing, getCompetitor, getSignal, getSource, organization } from "@/lib/demo-data";
import { briefingStatusLabel, formatDate, type Signal } from "@/lib/domain";

export function generateStaticParams() {
  return briefings.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getBriefing(id)?.title ?? "Briefing" };
}

export default async function BriefingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const briefing = getBriefing(id);
  if (!briefing) notFound();
  const items = briefing.signalIds.map(getSignal).filter((s): s is Signal => Boolean(s));
  const byCompetitor = new Map<string, Signal[]>();
  for (const s of items) byCompetitor.set(s.competitorId, [...(byCompetitor.get(s.competitorId) ?? []), s]);
  const footnote = (s: Signal) => items.indexOf(s) + 1;

  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Briefing", href: "/app/briefing" }, { label: briefing.title }]}>
        <CopyLinkButton />
      </Topbar>
      <article className="ws-content ws-content--doc ds-page">
        <Icon name="doc" className="page-head__icon" />
        <h1 style={{ fontSize: 32 }}>{briefing.title}</h1>
        <dl className="props">
          <dt>
            <Icon name="calendar" />
            Periodo
          </dt>
          <dd>{briefing.period}</dd>
          <dt>
            <Icon name="status" />
            Stato
          </dt>
          <dd>
            <Tag color={briefing.status === "sent" ? "green" : "gray"}>{briefingStatusLabel[briefing.status]}</Tag>
          </dd>
          <dt>
            <Icon name="clock" />
            Aggiornato
          </dt>
          <dd>{formatDate(briefing.date)}</dd>
        </dl>

        <div className="row no-print" style={{ marginBottom: 32 }}>
          <PrintButton />
          <DemoAction label="Modifica" icon="doc" />
          <DemoAction label="Condividi" icon="share" message="Il link di sola lettura per chi non ha l'account arriva in una fase successiva." />
        </div>

        <p className="lead" style={{ color: "var(--text)" }}>
          {briefing.intro}
        </p>

        {[...byCompetitor.entries()].map(([cid, list]) => (
          <section key={cid} className="block">
            <h2 style={{ fontSize: "var(--text-h3)", marginBottom: 16 }}>{getCompetitor(cid)?.name}</h2>
            <div className="stack">
              {list.map((s) => (
                <div key={s.id} className="doc-signal">
                  <CategoryTag category={s.category} />
                  <h3>
                    <Link href={`/app/segnali/${s.id}`}>{s.title}</Link>
                    <span className="footnote-ref">{footnote(s)}</span>
                  </h3>
                  <p className="small muted num">
                    {s.before} → {s.after}
                  </p>
                  <p style={{ marginTop: 8 }}>{s.interpretation}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <footer className="footnotes">
          <span className="xs">Fonti</span>
          <ol>
            {items.map((s) => {
              const src = getSource(s.sourceId);
              return (
                <li key={s.id}>
                  {src?.label}, {getCompetitor(s.competitorId)?.name}, osservata il {formatDate(s.observedAt)}.{" "}
                  <a href={src?.url} target="_blank" rel="noreferrer">
                    {src?.url}
                  </a>
                </li>
              );
            })}
          </ol>
        </footer>
      </article>
    </>
  );
}
