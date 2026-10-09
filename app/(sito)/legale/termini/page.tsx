import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Termini di servizio", description: "Le condizioni d'uso di Competia.Work." };

export default function TermsPage() {
  return (
    <LegalPage title="Termini di servizio" updated="9 ottobre 2026">
      <p>
        Questi termini regolano l&apos;uso di Competia.Work da parte delle aziende clienti e delle persone che fanno parte dei
        loro team. Il servizio è rivolto solo a professionisti e imprese.
      </p>

      <h2>Il servizio</h2>
      <p>
        Competia.Work è uno spazio di lavoro per raccogliere fonti pubbliche, registrare segnali competitivi e comporre
        briefing. Durante il programma pilota il servizio è offerto su invito e può cambiare.
      </p>

      <h2>Account e team</h2>
      <ul>
        <li>Ogni organizzazione ha un proprietario che invita i membri e ne gestisce i ruoli.</li>
        <li>Sei responsabile di chi accede con il tuo account e di tenere riservato il link di accesso.</li>
      </ul>

      <h2>Uso corretto</h2>
      <ul>
        <li>Inserisci solo informazioni pubbliche o che hai il diritto di usare.</li>
        <li>Non usare il servizio per accedere ad aree riservate di terzi o per raccogliere dati personali.</li>
        <li>Rispetta le condizioni d&apos;uso dei siti che consulti.</li>
      </ul>

      <h2>I contenuti restano tuoi</h2>
      <p>
        Fonti, segnali e briefing inseriti dal tuo team appartengono alla tua organizzazione. Li usiamo solo per fornirti il
        servizio e puoi esportarli in qualsiasi momento.
      </p>

      <h2>Responsabilità</h2>
      <p>
        Competia organizza le informazioni ma non ne garantisce l&apos;esattezza: la verifica dei segnali spetta al team che li
        inserisce. [Limiti di responsabilità da definire con il consulente legale.]
      </p>

      <h2>Corrispettivi e durata</h2>
      <p>[Condizioni economiche, durata, rinnovo e recesso: da definire.]</p>

      <h2>Legge applicabile</h2>
      <p>Si applica la legge italiana. Foro competente: [città].</p>
    </LegalPage>
  );
}
