import type { Metadata } from "next";
import Link from "next/link";
import Callout from "@/components/Callout";
import Icon from "@/components/Icon";
import { getAnalytics, type Point, type Range } from "@/lib/umami";

export const metadata: Metadata = { title: "Analytics del sito", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nf = new Intl.NumberFormat("it-IT");
const pf = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 0 });

function duration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

function label(x: string, range: Range) {
  const d = new Date(x.includes("T") || x.includes(" ") ? x.replace(" ", "T") : `${x}T00:00:00`);
  if (Number.isNaN(d.getTime())) return x;
  return range === "24h"
    ? d.toLocaleTimeString("it-IT", { hour: "2-digit", timeZone: "Europe/Rome" })
    : d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", timeZone: "Europe/Rome" });
}

function BarChart({ points, range }: { points: Point[]; range: Range }) {
  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 28, left: 36 };
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const ticks = [0, top / 2, top];
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;
  const bw = points.length ? iw / points.length : iw;
  const every = range === "24h" ? 4 : 1;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visualizzazioni di pagina nel periodo">
      {ticks.map((t) => {
        const y = pad.top + ih - (t / top) * ih;
        return (
          <g key={t}>
            <line className="grid" x1={pad.left} x2={W - pad.right} y1={y} y2={y} />
            <text className="axis" x={pad.left - 6} y={y + 4} textAnchor="end">
              {nf.format(t)}
            </text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const h = (p.y / top) * ih;
        const x = pad.left + i * bw;
        return (
          <g key={p.x}>
            <rect className="bar" x={x + bw * 0.15} y={pad.top + ih - h} width={bw * 0.7} height={Math.max(h, 0)} rx={2}>
              <title>
                {label(p.x, range)}: {nf.format(p.y)}
              </title>
            </rect>
            {i % every === 0 && (
              <text className="axis" x={x + bw / 2} y={H - 8} textAnchor="middle">
                {label(p.x, range)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const issues = {
  "not-configured": {
    title: "Analytics non collegata",
    text: "Mancano le variabili d'ambiente di Umami: UMAMI_API_URL, UMAMI_WEBSITE_ID e UMAMI_API_KEY (oppure UMAMI_API_TOKEN). Vanno impostate in Vercel.",
  },
  unavailable: { title: "Umami non risponde", text: "La richiesta a Umami non è andata a buon fine. Riprova tra poco o controlla le credenziali." },
  "invalid-response": { title: "Risposta inattesa", text: "Umami ha risposto con un formato che la pagina non riconosce." },
} as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams;
  const range: Range = periodo === "7d" ? "7d" : "24h";
  const result = await getAnalytics(range);

  return (
    <div className="container" style={{ paddingBlock: 32 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 32 }}>
        <Link href="/app" className="logo">
          <span>Competia<span>.Work</span></span>
        </Link>
        <Link href="/app" className="btn btn-ghost">
          <Icon name="arrowLeft" />
          Workspace
        </Link>
      </div>

      <header className="page-head">
        <Icon name="chart" className="page-head__icon" />
        <div className="page-head__row">
          <h1>Analytics del sito</h1>
          <nav className="row" aria-label="Periodo">
            <Link href="/analytics" className="chip" aria-current={range === "24h" ? "true" : undefined}>
              Ultime 24 ore
            </Link>
            <Link href="/analytics?periodo=7d" className="chip" aria-current={range === "7d" ? "true" : undefined}>
              Ultimi 7 giorni
            </Link>
          </nav>
        </div>
        <p className="muted">Traffico di competia.work da Umami. Pagina interna, non indicizzata.</p>
      </header>

      {!result.ok ? (
        <Callout icon="info">
          <strong>{issues[result.issue].title}.</strong> {issues[result.issue].text}
        </Callout>
      ) : (
        <div className="stack ds-page" style={{ gap: 32 }}>
          <div className="metric-grid">
            {[
              { label: "Visitatori ora", value: nf.format(result.data.active) },
              { label: "Visualizzazioni", value: nf.format(result.data.pageviews) },
              { label: "Visitatori", value: nf.format(result.data.visitors) },
              { label: "Visite", value: nf.format(result.data.visits) },
              { label: "Frequenza di rimbalzo", value: result.data.bounceRate === null ? "—" : pf.format(result.data.bounceRate) },
              { label: "Durata media visita", value: duration(result.data.avgVisitSeconds) },
            ].map((m) => (
              <div key={m.label} className="stat">
                <span className="small muted">{m.label}</span>
                <div className="stat__value">{m.value}</div>
              </div>
            ))}
          </div>
          <section className="card">
            <h2 className="block-title">Visualizzazioni di pagina</h2>
            <BarChart points={result.data.series} range={range} />
          </section>
          <p className="xs muted">
            Aggiornato alle{" "}
            {new Date(result.data.fetchedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" })}. Fonte: Umami.
          </p>
        </div>
      )}
    </div>
  );
}
