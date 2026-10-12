import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTag, StatusTag } from "@/components/SignalTags";
import CountUp from "@/components/motion/CountUp";
import Tag from "@/components/Tag";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { getWorkspace } from "@/lib/workspace/data";
import { briefingStatusLabel, formatShortDate } from "@/lib/domain";

export const metadata: Metadata = { title: "Panoramica" };

export default async function OverviewPage() {
  const { briefings, competitors, getCompetitor, getSignal, organization, signals, sources } = await getWorkspace();
  const toVerify = signals.filter((s) => s.status === "to_verify");
  const verified = signals.filter((s) => s.status === "verified");
  const inBriefing = signals.filter((s) => s.status === "in_briefing");
  const latestBriefing = [...briefings].sort((a, b) => b.date.localeCompare(a.date))[0];
  const activity = signals
    .flatMap((s) => s.history.map((h) => ({ ...h, signalId: s.id })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const stats = [
    { label: "Da verificare", value: toVerify.length, href: "/app/segnali?stato=to_verify" },
    { label: "Verificati", value: verified.length, href: "/app/segnali?stato=verified" },
    { label: "Nel briefing", value: inBriefing.length, href: "/app/segnali?stato=in_briefing" },
    { label: "Fonti seguite", value: sources.length, href: "/app/fonti" },
  ];

  return (
    <>
      <Topbar crumbs={[{ label: organization.name }, { label: "Panoramica" }]} />
      <div className="ws-content">
        <PageHead icon="home" eyebrow={organization.name} title="Panoramica" description="Cosa è cambiato e cosa resta da fare." />

        {sources.length === 0 && (
          <section className="ws-start ink" aria-labelledby="per-iniziare">
            <span className="eyebrow">Per iniziare</span>
            <h2 id="per-iniziare">
              Incolla il link di un competitor, <span className="hl">al resto pensiamo noi.</span>
            </h2>
            <ol className="steps ws-start__steps">
              <li>
                <div>
                  <h3>
                    <Link href="/app/competitor/nuovo">Aggiungi un competitor</Link>
                  </h3>
                  <p>Nome e sito dell&apos;azienda che vuoi seguire.{competitors.length > 0 && ` Fatto: ${competitors.length}.`}</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>
                    <Link href="/app/fonti/nuova">Incolla le sue pagine</Link>
                  </h3>
                  <p>Prezzi, promozioni, catalogo: le leggiamo subito e poi ogni mattina.</p>
                </div>
              </li>
              <li>
                <div>
                  <h3>Verifica i segnali</h3>
                  <p>Quando una pagina cambia, il segnale arriva qui in &ldquo;Da verificare&rdquo;.</p>
                </div>
              </li>
            </ol>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <Link href={competitors.length > 0 ? "/app/fonti/nuova" : "/app/competitor/nuovo"} className="btn btn-primary btn-lg">
                {competitors.length > 0 ? "Aggiungi una pagina" : "Aggiungi il primo competitor"}
              </Link>
            </div>
          </section>
        )}

        <div className="stat-row ds-stagger">
          {stats.map((s, i) => (
            <Link key={s.label} href={s.href} className="stat" style={{ "--i": i } as React.CSSProperties}>
              <span className="small muted">{s.label}</span>
              <div className="stat__value">
                <CountUp value={s.value} delay={i * 40} />
              </div>
            </Link>
          ))}
        </div>

        <section className="block">
          <h2 className="block-title">Da verificare</h2>
          {toVerify.length === 0 ? (
            <div className="empty">
              <strong>Tutto verificato</strong>Non ci sono segnali in attesa.
            </div>
          ) : (
            <ul className="list">
              {toVerify.map((s) => (
                <li key={s.id}>
                  <Link href={`/app/segnali/${s.id}`} className="list__item">
                    <span className="list__main">
                      <strong>{s.title}</strong>
                      <span className="xs muted">{getCompetitor(s.competitorId)?.name}</span>
                    </span>
                    <span className="list__aside">
                      <CategoryTag category={s.category} />
                      <span className="num">{formatShortDate(s.observedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid-2 block">
          <section>
            <h2 className="block-title">Ultimo briefing</h2>
            {!latestBriefing && (
              <div className="empty">
                <strong>Ancora nessun briefing</strong>
              </div>
            )}
            {latestBriefing && (
              <Link href={`/app/briefing/${latestBriefing.id}`} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="small muted">{latestBriefing.period}</span>
                  <Tag color={latestBriefing.status === "sent" ? "green" : "gray"}>
                    {briefingStatusLabel[latestBriefing.status]}
                  </Tag>
                </div>
                <h3 style={{ fontSize: "var(--text-h4)", marginTop: 8 }}>{latestBriefing.title}</h3>
                <p className="small muted" style={{ marginTop: 6 }}>
                  {latestBriefing.intro}
                </p>
              </Link>
            )}
          </section>
          <section>
            <h2 className="block-title">Attività recente</h2>
            {activity.length === 0 && (
              <div className="empty">
                <strong>Nessuna attività</strong>
              </div>
            )}
            <ol className="timeline">
              {activity.map((a, i) => {
                const s = getSignal(a.signalId);
                return (
                  <li key={i}>
                    <span>
                      <strong style={{ fontWeight: 500 }}>{a.by}</strong>{" "}
                      <span className="muted">ha segnato come</span> <StatusTag status={a.status} />{" "}
                      <Link href={`/app/segnali/${a.signalId}`} className="link">
                        {s?.title}
                      </Link>
                      <span className="xs muted"> · {formatShortDate(a.at)}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
