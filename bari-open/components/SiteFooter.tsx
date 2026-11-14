import Link from "next/link";
import { formatDateIt, loadBundle } from "@/lib/data";
import { freshnessLabel } from "@/lib/freshness";

export async function SiteFooter() {
  const bundle = await loadBundle();
  const syncedDate = formatDateIt(bundle.syncedAt.slice(0, 10));
  const syncedTime = new Date(bundle.syncedAt).toLocaleTimeString("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
  });
  const freshness = freshnessLabel(bundle.syncedAt);

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          <strong>Vista Bari</strong> è un prototipo civico basato su open data del{" "}
          <a href="https://opendata.comune.bari.it" rel="noreferrer" target="_blank">
            Comune di Bari
          </a>
          . Non utilizza telecamere né dati di videosorveglianza: solo conteggi da spire
          semaforiche e dataset pubblici.{" "}
          <Link href="/stato">Stato sync</Link>
        </p>
        <p
          className={`freshness-badge${freshness.stale ? " freshness-badge--stale" : ""}`}
          title={bundle.syncedAt}
        >
          {freshness.stale ? "⚠ " : ""}
          Dati aggiornati · {syncedDate} · {syncedTime} Europe/Rome
        </p>
      </div>
    </footer>
  );
}
