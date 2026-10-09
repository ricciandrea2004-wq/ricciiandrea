import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Informativa privacy", description: "Come Competia tratta i dati personali." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Informativa privacy" updated="9 ottobre 2026">
      <p>
        Questa informativa spiega quali dati personali raccoglie Competia.Work, perché, per quanto tempo e quali diritti
        hai, ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).
      </p>

      <h2>Titolare del trattamento</h2>
      <p>[Ragione sociale], [indirizzo della sede], P. IVA [numero]. Contatto per la privacy: [email].</p>

      <h2>Quali dati raccogliamo</h2>
      <ul>
        <li>
          <strong>Richiesta di accesso:</strong> l&apos;email di lavoro che inserisci nel modulo e la data della richiesta.
        </li>
        <li>
          <strong>Account:</strong> nome, email, organizzazione e ruolo, quando entri nel workspace.
        </li>
        <li>
          <strong>Contenuti del workspace:</strong> fonti, segnali, commenti e briefing che il tuo team inserisce, con il nome
          di chi li ha creati o modificati.
        </li>
        <li>
          <strong>Dati tecnici:</strong> statistiche aggregate sulle visite al sito, senza cookie di profilazione.
        </li>
      </ul>

      <h2>Perché li trattiamo</h2>
      <ul>
        <li>Rispondere alla richiesta di accesso e inviarti l&apos;email di conferma (misure precontrattuali, art. 6.1.b).</li>
        <li>Fornire il servizio a te e al tuo team (esecuzione del contratto, art. 6.1.b).</li>
        <li>Capire come viene usato il sito, in forma aggregata (legittimo interesse, art. 6.1.f).</li>
      </ul>

      <h2>Per quanto tempo</h2>
      <p>
        Le richieste di accesso restano fino a [12 mesi] o finché non chiedi di cancellarle. I dati dell&apos;account restano
        per la durata del contratto e poi [30 giorni] per l&apos;esportazione, salvo obblighi di legge.
      </p>

      <h2>Chi tratta i dati per nostro conto</h2>
      <ul>
        <li>Supabase (database), con server nell&apos;Unione europea.</li>
        <li>Resend (invio delle email), con server nell&apos;Unione europea.</li>
        <li>Vercel (hosting del sito).</li>
        <li>[Servizio di statistiche delle visite].</li>
      </ul>
      <p>
        Con ciascuno è in vigore un accordo sul trattamento dei dati. Dove i dati possono uscire dallo Spazio economico
        europeo, il trasferimento si basa sulle clausole contrattuali standard della Commissione europea.
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento scrivendo a
        [email]. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.
      </p>
    </LegalPage>
  );
}
