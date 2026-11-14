import type { Metadata } from "next";
import Link from "next/link";
import { formatDateIt, formatNumber, getInsights, loadBundle } from "@/lib/data";
import { cityMomDelta, injuryRatePct } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "Anteprima email briefing",
};

export default async function BriefingEmailPreviewPage() {
  const bundle = await loadBundle();
  const insights = getInsights(bundle);
  const mom = cityMomDelta(bundle);
  const injuryPct = injuryRatePct(bundle);
  const synced = formatDateIt(bundle.syncedAt.slice(0, 10));

  return (
    <section className="section" style={{ paddingTop: "2rem" }}>
      <div className="container" style={{ maxWidth: "40rem" }}>
        <div className="page-hero">
          <p className="section__eyebrow">Newsletter-style</p>
          <h1>Anteprima email briefing</h1>
          <p className="section__lead">
            HTML statico di anteprima (nessun invio). Utile per valutare tono e layout prima di un
            digest assessorile.
          </p>
          <Link className="btn btn--ghost-dark no-print" href="/briefing">
            Torna al briefing
          </Link>
        </div>

        <div className="email-preview">
          <div className="email-preview__inner">
            <p style={{ margin: 0, color: "#1a8a9e", fontSize: "0.8rem", letterSpacing: "0.08em" }}>
              VISTA BARI
            </p>
            <h2 style={{ fontFamily: "Georgia, serif", color: "#083f4c", margin: "0.4rem 0 0.75rem" }}>
              Briefing mobilità · {synced}
            </h2>
            <p style={{ color: "#3a4650", marginTop: 0 }}>
              Media città {formatNumber(bundle.summary.cityDailyAvg)} · MoM{" "}
              {mom.pctDelta == null
                ? "n/d"
                : `${mom.pctDelta >= 0 ? "+" : ""}${mom.pctDelta.toFixed(1)}%`}{" "}
              · tasso lesioni {injuryPct.toFixed(1)}%
            </p>
            <ol style={{ color: "#3a4650", paddingLeft: "1.2rem" }}>
              {insights.briefingFindings.slice(0, 5).map((f, i) => (
                <li key={i} style={{ marginBottom: "0.55rem" }}>
                  {f}
                </li>
              ))}
            </ol>
            <p style={{ fontSize: "0.85rem", color: "#6a7580", marginBottom: 0 }}>
              Fonte: open data Comune di Bari · prototipo Vista Bari (nessuna telecamera).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
