import Link from "next/link";
import { formatDateIt, formatNumber, getInsights, loadBundle } from "@/lib/data";

export default async function HomePage() {
  const bundle = await loadBundle();
  const synced = formatDateIt(bundle.syncedAt.slice(0, 10));
  const insights = getInsights(bundle);
  const homeFindings = insights.briefingFindings.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero__media" aria-hidden="true" />
        <div className="container hero__content">
          <h1 className="hero__brand">
            Vista <em>Bari</em>
          </h1>
          <p className="hero__lead">
            Il traffico della città, letto dai dati aperti del Comune: centraline, flussi e
            sicurezza stradale in un unico cruscotto da offrire all’amministrazione.
          </p>
          <div className="cta-row">
            <Link className="btn btn--primary" href="/mappa">
              Apri la mappa
            </Link>
            <Link className="btn btn--ghost" href="/briefing">
              Briefing settimanale
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section__eyebrow">Dati vivi</p>
          <h2 className="section__title">Cosa mostra oggi</h2>
          <p className="section__lead">
            Prototipo costruito solo su dataset pubblici di{" "}
            <a href="https://opendata.comune.bari.it" target="_blank" rel="noreferrer">
              opendata.comune.bari.it
            </a>
            . Ultimo sync: {synced}.
          </p>
          <div className="stat-strip">
            <div className="stat">
              <strong>{formatNumber(bundle.summary.centralineCount)}</strong>
              <span>centraline semaforiche mappate</span>
            </div>
            <div className="stat">
              <strong>{formatNumber(bundle.summary.cityDailyAvg)}</strong>
              <span>passaggi medi giornalieri in città</span>
            </div>
            <div className="stat">
              <strong>{formatNumber(bundle.summary.accidentCount)}</strong>
              <span>incidenti 2025 geolocalizzati</span>
            </div>
          </div>

          <div className="home-insights">
            <p className="section__eyebrow">Evidenze</p>
            <h3 className="home-insights__title">Insight dal briefing</h3>
            <ul className="home-insights__list">
              {homeFindings.map((finding, i) => (
                <li key={`${i}-${finding.slice(0, 20)}`}>{finding}</li>
              ))}
            </ul>
            <Link className="btn btn--ghost-dark" href="/briefing">
              Apri il briefing completo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
