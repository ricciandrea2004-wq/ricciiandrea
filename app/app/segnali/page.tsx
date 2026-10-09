import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import LottieAnimation from "@/components/motion/LottieAnimation";
import { CategoryTag, StatusTag } from "@/components/SignalTags";
import PageHead from "@/components/workspace/PageHead";
import Topbar from "@/components/workspace/Topbar";
import { competitors, getCompetitor, getSource, organization, signals } from "@/lib/demo-data";
import {
  categories,
  categoryLabel,
  formatShortDate,
  statusColor,
  statuses,
  statusLabel,
  type Category,
  type SignalStatus,
} from "@/lib/domain";

export const metadata: Metadata = { title: "Segnali" };

type Params = { vista?: string; categoria?: string; stato?: string; competitor?: string };

function href(current: Params, patch: Partial<Params>) {
  const next = { ...current, ...patch };
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
  const s = q.toString();
  return `/app/segnali${s ? `?${s}` : ""}`;
}

export default async function SignalsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const view = params.vista === "board" ? "board" : "tabella";
  const category = categories.includes(params.categoria as Category) ? (params.categoria as Category) : undefined;
  const status = statuses.includes(params.stato as SignalStatus) ? (params.stato as SignalStatus) : undefined;
  const competitor = competitors.some((c) => c.id === params.competitor) ? params.competitor : undefined;
  const current: Params = { vista: view === "board" ? "board" : undefined, categoria: category, stato: status, competitor };

  const rows = signals
    .filter((s) => (!category || s.category === category) && (!status || s.status === status) && (!competitor || s.competitorId === competitor))
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));

  return (
    <>
      <Topbar crumbs={[{ label: organization.name, href: "/app" }, { label: "Segnali" }]} />
      <div className="ws-content">
        <PageHead
          icon="signal"
          title="Segnali"
          description="Ogni cambiamento osservato sui competitor, con la sua fonte. Nel briefing entrano solo quelli verificati."
          actions={
            <Link href="/app/segnali/nuovo" className="btn btn-primary">
              <Icon name="plus" />
              Nuovo segnale
            </Link>
          }
        />

        <div className="db-toolbar">
          <Link href={href(current, { vista: undefined })} className="view-tab" aria-current={view === "tabella" ? "page" : undefined}>
            <Icon name="table" />
            Tabella
          </Link>
          <Link href={href(current, { vista: "board" })} className="view-tab" aria-current={view === "board" ? "page" : undefined}>
            <Icon name="board" />
            Per stato
          </Link>
          <span className="db-toolbar__spacer" />
          <span className="xs muted num">
            {rows.length} di {signals.length}
          </span>
        </div>

        <div className="filters" aria-label="Filtri">
          <Link href={href(current, { categoria: undefined, stato: undefined, competitor: undefined })} className="chip" aria-current={!category && !status && !competitor ? "true" : undefined}>
            Tutti
          </Link>
          {categories.map((c) => (
            <Link key={c} href={href(current, { categoria: category === c ? undefined : c })} className="chip" aria-current={category === c ? "true" : undefined}>
              {categoryLabel[c]}
            </Link>
          ))}
          {view === "tabella" &&
            statuses.map((s) => (
              <Link key={s} href={href(current, { stato: status === s ? undefined : s })} className="chip" aria-current={status === s ? "true" : undefined}>
                {statusLabel[s]}
              </Link>
            ))}
          {competitors.map((c) => (
            <Link key={c.id} href={href(current, { competitor: competitor === c.id ? undefined : c.id })} className="chip" aria-current={competitor === c.id ? "true" : undefined}>
              {c.name}
            </Link>
          ))}
        </div>

        {view === "tabella" ? (
          rows.length === 0 ? (
            <div className="empty">
              <LottieAnimation name="nessun-risultato" width={40} height={40} delay={120} className="lottie--center" />
              <strong>Nessun segnale con questi filtri</strong>
              <Link href="/app/segnali" className="link">
                Togli i filtri
              </Link>
            </div>
          ) : (
            <div className="table-wrap ds-page">
              <table className="db-table">
                <thead>
                  <tr>
                    <th scope="col">Segnale</th>
                    <th scope="col">Competitor</th>
                    <th scope="col">Categoria</th>
                    <th scope="col">Stato</th>
                    <th scope="col">Prima → dopo</th>
                    <th scope="col">Fonte</th>
                    <th scope="col">Osservato</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td className="title-cell">
                        <Link href={`/app/segnali/${s.id}`}>{s.title}</Link>
                      </td>
                      <td className="nowrap">{getCompetitor(s.competitorId)?.name}</td>
                      <td>
                        <CategoryTag category={s.category} />
                      </td>
                      <td>
                        <StatusTag status={s.status} live />
                      </td>
                      <td className="num muted" style={{ minWidth: 200 }}>
                        {s.before} → {s.after}
                      </td>
                      <td className="nowrap">
                        <Link href={`/app/fonti/${s.sourceId}`} className="link">
                          {getSource(s.sourceId)?.label}
                        </Link>
                      </td>
                      <td className="nowrap num">{formatShortDate(s.observedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="db-foot">Ordinati dal più recente</div>
            </div>
          )
        ) : (
          <div className="board ds-page">
            {statuses.map((st) => {
              const col = rows.filter((s) => s.status === st);
              return (
                <section key={st} aria-label={statusLabel[st]}>
                  <div className="board-col__head">
                    <span className={`tag tag-${statusColor[st]}`}>{statusLabel[st]}</span>
                    <span className="num">{col.length}</span>
                  </div>
                  <div className="board-col__list">
                    {col.length === 0 && <div className="board-empty">Nessun segnale</div>}
                    {col.map((s) => (
                      <Link key={s.id} href={`/app/segnali/${s.id}`} className="board-card">
                        <strong>{s.title}</strong>
                        <span className="row">
                          <CategoryTag category={s.category} />
                          <span className="xs muted">
                            {getCompetitor(s.competitorId)?.name} · {formatShortDate(s.observedAt)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
