import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Cookie policy", description: "Quali cookie e tecnologie simili usa Competia." };

export default function CookiePage() {
  return (
    <LegalPage title="Cookie policy" updated="9 ottobre 2026">
      <p>competia.work usa solo i cookie e gli spazi di memoria del browser necessari a far funzionare il sito.</p>

      <h2>Cosa usiamo</h2>
      <ul>
        <li>
          <strong>Sessione del workspace:</strong> un cookie tecnico che ti tiene collegato dopo l&apos;accesso. Senza, il
          workspace non funziona.
        </li>
        <li>
          <strong>Preferenza del tema:</strong> la scelta tra tema chiaro, scuro o di sistema, salvata nella memoria locale del
          browser.
        </li>
        <li>
          <strong>Statistiche delle visite:</strong> [servizio], configurato senza cookie e senza dati che ti identificano.
        </li>
      </ul>

      <h2>Cosa non usiamo</h2>
      <p>Nessun cookie pubblicitario o di profilazione e nessun tracciamento tra siti diversi.</p>

      <h2>Servizi esterni</h2>
      <p>
        I caratteri tipografici sono caricati da Google Fonts, che riceve l&apos;indirizzo IP del visitatore. [Valutare se
        ospitarli direttamente sul sito.]
      </p>

      <h2>Come gestirli</h2>
      <p>
        Puoi cancellare cookie e memoria locale dalle impostazioni del browser. Poiché usiamo solo strumenti tecnici, non
        serve un banner di consenso.
      </p>
    </LegalPage>
  );
}
