// Every email Competia sends: subject, HTML and plain text, in Italian.
// The registry at the bottom is what lib/email/send.ts and the previews use.
import type { Category, SignalStatus } from "../domain";
import {
  button,
  callout,
  code,
  context,
  esc,
  fallbackLink,
  h1,
  h2,
  hero,
  layout,
  link,
  p,
  pHtml,
  signalList,
  stats,
  strong,
  textLayout,
  type Ctx,
  type RenderOptions,
  type SignalRow,
} from "./html";
import { categoryLabel, statusLabel } from "../domain";
import { tokens } from "./tokens";

export type Rendered = { subject: string; html: string; text: string };

const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" });
const dateTimeFmt = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});
const day = (iso: string) => dateFmt.format(new Date(iso));
const dayTime = (iso: string) => dateTimeFmt.format(new Date(iso));
const hello = (name?: string) => (name ? `Ciao ${name},` : "Ciao,");
const others = (n: number) => (n === 1 ? "E un altro nello spazio di lavoro." : `E altri ${n} nello spazio di lavoro.`);

// ——— 1. Richiesta ricevuta ——————————————————————————————————————————————————————

export type RichiestaRicevuta = Record<string, never>;

function richiestaRicevuta(_: RichiestaRicevuta, ctx: Ctx): Rendered {
  const subject = "Abbiamo ricevuto la tua richiesta di accesso";
  const reason = "Ricevi questa email perché questo indirizzo ha chiesto l'accesso su competia.work. Se non sei stato tu, puoi ignorarla.";
  const steps = [
    "Ti scriviamo quando si apre un posto nel programma pilota.",
    "Configuriamo insieme i primi competitor e le prime fonti.",
    "Ricevi il link per entrare nel tuo spazio di lavoro.",
  ];
  const html = layout({
    ctx,
    title: subject,
    preheader: "Ti scriviamo appena si apre un posto nel programma pilota.",
    reason,
    body: [
      hero(ctx, "richiesta", "Richiesta ricevuta"),
      h1("Richiesta ricevuta."),
      p("Grazie per aver chiesto l'accesso a Competia. Lavoriamo con pochi team alla volta, così possiamo seguire bene ognuno."),
      h2("Cosa succede dopo"),
      callout(steps.map((s, i) => pHtml(`${strong(`${i + 1}.`)}&nbsp; ${esc(s)}`, "text", 15)).join("")),
      p("Nel frattempo puoi vedere come funziona il prodotto, dalla fonte al briefing.", "secondary", 15),
      button(`${ctx.site}/prodotto`, "Scopri il prodotto"),
    ].join("\n"),
  });
  const text = textLayout(
    [
      "Ciao,",
      "",
      "grazie per aver chiesto l'accesso a Competia. Lavoriamo con pochi team alla volta, così possiamo seguire bene ognuno.",
      "",
      "Cosa succede dopo:",
      ...steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      `Nel frattempo puoi vedere come funziona il prodotto: ${ctx.site}/prodotto`,
    ],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 2. Accesso approvato (invito) ———————————————————————————————————————————————

export type AccessoApprovato = {
  /** Link that accepts the invite: /invito/[token] or a Supabase invite link. */
  url: string;
  organizzazione?: string;
  /** Who invited: a team member, or omitted when Competia opens the pilot. */
  invitatoDa?: string;
  scadenzaGiorni?: number;
};

function accessoApprovato(d: AccessoApprovato, ctx: Ctx): Rendered {
  const where = d.organizzazione ? `lo spazio di ${d.organizzazione}` : "il tuo spazio di lavoro";
  const subject = d.invitatoDa
    ? `${d.invitatoDa} ti ha invitato su Competia`
    : "Il tuo accesso a Competia è pronto";
  const intro = d.invitatoDa
    ? `${d.invitatoDa} ti ha invitato su Competia, in ${where}.`
    : `Si è aperto un posto nel programma pilota: ${where} è pronto.`;
  const days = d.scadenzaGiorni ?? 7;
  const reason = "Ricevi questa email perché qualcuno ti ha dato accesso a competia.work. Se non ti aspettavi l'invito, puoi ignorarla.";
  const html = layout({
    ctx,
    title: subject,
    preheader: "Entra con questo indirizzo email: non serve una password.",
    reason,
    body: [
      hero(ctx, "verifica", "Accesso approvato"),
      h1(d.invitatoDa ? "Ti hanno invitato su Competia." : "Il tuo accesso è pronto."),
      p(intro),
      p("Entri con questo indirizzo email: ti mandiamo un link ogni volta, senza password."),
      button(d.url, "Accetta l'invito"),
      p(`L'invito vale ${days} giorni.`, "secondary", 14),
      fallbackLink(d.url),
    ].join("\n"),
  });
  const text = textLayout(
    [hello(), "", intro, "", "Entri con questo indirizzo email: ti mandiamo un link ogni volta, senza password.", "", `Accetta l'invito: ${d.url}`, "", `L'invito vale ${days} giorni.`],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 3. Link di accesso ———————————————————————————————————————————————————————————

export type LinkAccesso = {
  url: string;
  /** The 6-digit code Supabase sends with the link; shown as an alternative. */
  codice?: string;
  /** "conferma" when the link confirms a new or changed address, "recupero" for a password reset. */
  tipo?: "accesso" | "conferma" | "recupero";
  scadenzaMinuti?: number;
};

const linkCopy = {
  accesso: {
    subject: "Il tuo link per entrare in Competia",
    title: "Entra in Competia.",
    text: "Premi il bottone per entrare. Non serve una password.",
    plain: "apri questo link per entrare in Competia. Non serve una password.",
    button: "Entra in Competia",
    reason:
      "Ricevi questa email perché qualcuno ha chiesto di entrare su competia.work con questo indirizzo. Se non sei stato tu, ignorala: senza il link nessuno può entrare.",
  },
  conferma: {
    subject: "Conferma il tuo indirizzo email",
    title: "Conferma il tuo indirizzo.",
    text: "Premi il bottone per confermare questo indirizzo email.",
    plain: "apri questo link per confermare il tuo indirizzo email:",
    button: "Conferma l'indirizzo",
    reason:
      "Ricevi questa email perché qualcuno ha chiesto di entrare su competia.work con questo indirizzo. Se non sei stato tu, ignorala: senza il link nessuno può entrare.",
  },
  recupero: {
    subject: "Reimposta la password di Competia",
    title: "Scegli una nuova password.",
    text: "Premi il bottone per scegliere una nuova password. Quella vecchia smette di valere quando salvi la nuova.",
    plain: "apri questo link per scegliere una nuova password:",
    button: "Reimposta la password",
    reason:
      "Ricevi questa email perché qualcuno ha chiesto di reimpostare la password di competia.work per questo indirizzo. Se non sei stato tu, ignorala: la tua password resta quella di prima.",
  },
};

function linkAccesso(d: LinkAccesso, ctx: Ctx): Rendered {
  const copy = linkCopy[d.tipo ?? "accesso"];
  const minutes = d.scadenzaMinuti ?? 60;
  const validity = minutes % 60 === 0 ? `${minutes / 60} ${minutes === 60 ? "ora" : "ore"}` : `${minutes} minuti`;
  const subject = copy.subject;
  const reason = copy.reason;
  const html = layout({
    ctx,
    title: subject,
    preheader: `Il link vale ${validity} e si usa una volta sola.`,
    reason,
    body: [
      hero(ctx, "email", "Email"),
      h1(copy.title),
      p(copy.text),
      button(d.url, copy.button),
      d.codice ? p("Oppure inserisci questo codice nella pagina di accesso:", "secondary", 15) : "",
      d.codice ? code(d.codice) : "",
      p(`Il link vale ${validity} e si usa una volta sola.`, "secondary", 14),
      fallbackLink(d.url),
    ].join("\n"),
  });
  const text = textLayout(
    [
      hello(),
      "",
      copy.plain,
      d.url,
      d.codice ? `\nOppure inserisci questo codice nella pagina di accesso: ${d.codice}` : null,
      "",
      `Il link vale ${validity} e si usa una volta sola.`,
    ],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 4. Benvenuto (primo accesso) ———————————————————————————————————————————————————

export type Benvenuto = { nome?: string; organizzazione?: string };

function benvenuto(d: Benvenuto, ctx: Ctx): Rendered {
  const subject = "Benvenuto in Competia: i primi tre passi";
  const reason = "Ricevi questa email perché sei entrato per la prima volta su competia.work.";
  const steps = [
    { title: "Annota la fonte", text: "Aggiungi la pagina da cui arriva il dato, con competitor e categoria.", href: "/app/fonti" },
    { title: "Verifica il segnale", text: "Confronta il prima e il dopo e decidi se è un cambiamento reale.", href: "/app/segnali" },
    { title: "Componi il briefing", text: "Scegli i segnali verificati: ogni affermazione porta alla sua fonte.", href: "/app/briefing/nuovo" },
  ];
  const html = layout({
    ctx,
    title: subject,
    preheader: "Dalla prima fonte al primo briefing, in tre passi.",
    reason,
    body: [
      hero(ctx, "fonte", "Annota la fonte"),
      h1(d.nome ? `Benvenuto, ${d.nome}.` : "Benvenuto in Competia."),
      p(
        `${d.organizzazione ? `Lo spazio di ${d.organizzazione} è pronto. ` : ""}Competia tiene insieme i segnali su prezzi, assortimento e promozioni dei tuoi competitor, ognuno con la pagina da cui arriva.`,
      ),
      h2("I primi tre passi"),
      steps
        .map((s, i) =>
          pHtml(`${strong(`${i + 1}. ${s.title}`)}<br>${esc(s.text)} ${link(`${ctx.site}${s.href}`, "Apri")}`, "text", 15),
        )
        .join(""),
      button(`${ctx.site}/app`, "Apri lo spazio di lavoro"),
      p("Se ti serve una mano a configurare i primi competitor, rispondi a questa email: la leggiamo noi.", "secondary", 15),
    ].join("\n"),
  });
  const text = textLayout(
    [
      hello(d.nome),
      "",
      `${d.organizzazione ? `lo spazio di ${d.organizzazione} è pronto. ` : ""}Competia tiene insieme i segnali su prezzi, assortimento e promozioni dei tuoi competitor, ognuno con la pagina da cui arriva.`,
      "",
      "I primi tre passi:",
      ...steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text} ${ctx.site}${s.href}`),
      "",
      `Apri lo spazio di lavoro: ${ctx.site}/app`,
      "",
      "Se ti serve una mano a configurare i primi competitor, rispondi a questa email: la leggiamo noi.",
    ],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 5. Riepilogo settimanale ——————————————————————————————————————————————————————

export type SegnaleEmail = {
  id: string;
  competitor: string;
  categoria: Category;
  titolo: string;
  prima?: string;
  dopo?: string;
  stato: SignalStatus;
  osservatoIl: string;
};

export type RiepilogoSettimanale = {
  nome?: string;
  organizzazione: string;
  /** ISO dates, inclusive. */
  da: string;
  a: string;
  conteggi: { nuovi: number; verificati: number; daVerificare: number };
  /** The most relevant signals of the week, already ordered; at most 5 are shown. */
  segnali: SegnaleEmail[];
};

function riepilogoSettimanale(d: RiepilogoSettimanale, ctx: Ctx): Rendered {
  const period = `${day(d.da)} – ${day(d.a)}`;
  const subject = d.conteggi.nuovi
    ? `${d.conteggi.nuovi} ${d.conteggi.nuovi === 1 ? "segnale" : "segnali"} questa settimana · ${d.organizzazione}`
    : `Settimana tranquilla · ${d.organizzazione}`;
  const reason = `Ricevi questo riepilogo ogni lunedì perché fai parte dello spazio ${d.organizzazione} su competia.work.`;
  const shown = d.segnali.slice(0, 5);
  const rows: SignalRow[] = shown.map((s) => ({
    competitor: s.competitor,
    category: s.categoria,
    title: s.titolo,
    before: s.prima,
    after: s.dopo,
    status: s.stato,
    url: `${ctx.site}/app/segnali/${s.id}`,
  }));
  const html = layout({
    ctx,
    title: subject,
    preheader: `${period}: ${d.conteggi.nuovi} nuovi, ${d.conteggi.verificati} verificati, ${d.conteggi.daVerificare} da verificare.`,
    reason,
    footerExtra: `Per non riceverlo più, ${link(`${ctx.site}/app/impostazioni/profilo`, "cambia le notifiche")} o rispondi a questa email.`,
    body: [
      hero(ctx, "briefing", "Riepilogo"),
      p(`Riepilogo settimanale · ${period}`, "secondary", 14),
      h1(d.nome ? `${d.nome}, ecco cosa è cambiato.` : "Ecco cosa è cambiato."),
      stats([
        { value: d.conteggi.nuovi, label: "nuovi segnali" },
        { value: d.conteggi.verificati, label: "verificati" },
        { value: d.conteggi.daVerificare, label: "da verificare" },
      ]),
      shown.length ? h2("I segnali della settimana") : "",
      shown.length
        ? signalList(rows, ctx)
        : p("Nessun nuovo segnale questa settimana. Le fonti restano sotto controllo.", "secondary"),
      d.segnali.length > shown.length ? p(others(d.segnali.length - shown.length), "secondary", 14) : "",
      d.conteggi.daVerificare
        ? button(`${ctx.site}/app/segnali?stato=to_verify`, `Verifica ${d.conteggi.daVerificare === 1 ? "il segnale" : `i ${d.conteggi.daVerificare} segnali`}`)
        : button(`${ctx.site}/app/briefing/nuovo`, "Componi il briefing"),
    ].join("\n"),
  });
  const text = textLayout(
    [
      `Riepilogo settimanale · ${d.organizzazione} · ${period}`,
      "",
      `${d.conteggi.nuovi} nuovi segnali · ${d.conteggi.verificati} verificati · ${d.conteggi.daVerificare} da verificare`,
      "",
      ...(shown.length
        ? shown.flatMap((s) => [
            `- ${s.titolo}`,
            `  ${s.competitor} · ${categoryLabel[s.categoria]} · ${statusLabel[s.stato]}`,
            s.prima && s.dopo ? `  ${s.prima} → ${s.dopo}` : null,
            `  ${ctx.site}/app/segnali/${s.id}`,
          ])
        : ["Nessun nuovo segnale questa settimana. Le fonti restano sotto controllo."]),
      d.segnali.length > shown.length ? `\n${others(d.segnali.length - shown.length)}` : null,
      "",
      `Apri i segnali: ${ctx.site}/app/segnali`,
    ],
    `${reason} Per non riceverlo più: ${ctx.site}/app/impostazioni/profilo`,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 6. Segnali fermi "Da verificare" ————————————————————————————————————————————————

export type SegnaliDaVerificare = {
  nome?: string;
  organizzazione: string;
  /** How many days a signal can stay "Da verificare" before this alert. */
  sogliaGiorni: number;
  segnali: SegnaleEmail[];
};

function segnaliDaVerificare(d: SegnaliDaVerificare, ctx: Ctx): Rendered {
  const n = d.segnali.length;
  const subject =
    n === 1
      ? `Un segnale aspetta la verifica da più di ${d.sogliaGiorni} giorni`
      : `${n} segnali aspettano la verifica da più di ${d.sogliaGiorni} giorni`;
  const reason = `Ricevi questo avviso perché fai parte dello spazio ${d.organizzazione} su competia.work e alcuni segnali sono fermi.`;
  const now = Date.now();
  const age = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  const rows: SignalRow[] = d.segnali.slice(0, 8).map((s) => ({
    competitor: s.competitor,
    category: s.categoria,
    title: s.titolo,
    before: s.prima,
    after: s.dopo,
    status: "to_verify",
    meta: `Osservato il ${day(s.osservatoIl)} · fermo da ${age(s.osservatoIl)} giorni`,
    url: `${ctx.site}/app/segnali/${s.id}`,
  }));
  const html = layout({
    ctx,
    title: subject,
    preheader: "Un segnale non verificato non entra nel briefing. Bastano pochi minuti.",
    reason,
    footerExtra: `Puoi ${link(`${ctx.site}/app/impostazioni/profilo`, "cambiare le notifiche")}.`,
    body: [
      hero(ctx, "avviso", "Avviso"),
      h1(n === 1 ? "Un segnale è fermo." : `${n} segnali sono fermi.`),
      p(
        `${n === 1 ? "Questo segnale è" : "Questi segnali sono"} in stato Da verificare da più di ${d.sogliaGiorni} giorni. Finché nessuno li verifica o li scarta non entrano nel briefing, e una promozione può finire prima che qualcuno la veda.`,
      ),
      signalList(rows, ctx),
      n > rows.length ? p(others(n - rows.length), "secondary", 14) : "",
      button(`${ctx.site}/app/segnali?stato=to_verify`, "Apri i segnali da verificare"),
    ].join("\n"),
  });
  const text = textLayout(
    [
      hello(d.nome),
      "",
      `${n === 1 ? "questo segnale è" : "questi segnali sono"} in stato Da verificare da più di ${d.sogliaGiorni} giorni. Finché nessuno li verifica o li scarta non entrano nel briefing.`,
      "",
      ...d.segnali.slice(0, 8).flatMap((s) => [
        `- ${s.titolo}`,
        `  ${s.competitor} · ${categoryLabel[s.categoria]} · osservato il ${day(s.osservatoIl)}, fermo da ${age(s.osservatoIl)} giorni`,
        `  ${ctx.site}/app/segnali/${s.id}`,
      ]),
      "",
      `Apri i segnali da verificare: ${ctx.site}/app/segnali?stato=to_verify`,
    ],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— 7. Sito non risponde (interno) ——————————————————————————————————————————————————

export type Problema = { url: string; stato: number | null; errore?: string; ms: number };

export type SitoNonRisponde = { controllatoIl: string; problemi: Problema[]; controllati: number };

function sitoNonRisponde(d: SitoNonRisponde, ctx: Ctx): Rendered {
  const subject = `[competia.work] ${d.problemi.length} ${d.problemi.length === 1 ? "pagina non risponde" : "pagine non rispondono"}`;
  const reason = "Avviso interno del controllo automatico del sito. Va solo agli indirizzi del team.";
  const describe = (x: Problema) => (x.stato ? `risposta ${x.stato}` : `nessuna risposta${x.errore ? ` (${x.errore})` : ""}`);
  const rows = d.problemi
    .map(
      (x) =>
        `<tr><td class="em-border" style="border-top:1px solid ${tokens.light.border};padding:10px 0;">${pHtml(`${link(x.url, x.url)}<br><span class="em-text2" style="color:${tokens.light.textSecondary};">${esc(describe(x))} · ${esc(x.ms)} ms</span>`, "text", 14)}</td></tr>`,
    )
    .join("");
  const html = layout({
    ctx,
    title: subject,
    preheader: `${d.problemi.length} su ${d.controllati} controlli falliti alle ${dayTime(d.controllatoIl)}.`,
    reason,
    body: [
      hero(ctx, "avviso", "Avviso"),
      h1("Il sito non risponde bene."),
      p(`Controllo delle ${dayTime(d.controllatoIl)}: ${d.problemi.length} su ${d.controllati} indirizzi non hanno risposto 200.`),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">${rows}</table>`,
      callout(
        [
          p("Cosa guardare per primo:", "text", 15),
          pHtml(`1. Lo stato dell'ultimo deploy su ${link("https://vercel.com/andrea-riccis-projects-6714dfee/competia-work", "Vercel")}.`, "text", 15),
          pHtml(`2. Gli errori delle funzioni nei log di Vercel.`, "text", 15),
          pHtml(`3. Se l'ultimo deploy è rotto, si torna al precedente con "Instant Rollback".`, "text", 15),
        ].join(""),
      ),
    ].join("\n"),
  });
  const text = textLayout(
    [
      `Controllo delle ${dayTime(d.controllatoIl)}: ${d.problemi.length} su ${d.controllati} indirizzi non hanno risposto 200.`,
      "",
      ...d.problemi.map((x) => `- ${x.url}: ${describe(x)}, ${x.ms} ms`),
      "",
      "Cosa guardare per primo:",
      "1. Lo stato dell'ultimo deploy su Vercel: https://vercel.com/andrea-riccis-projects-6714dfee/competia-work",
      "2. Gli errori delle funzioni nei log di Vercel.",
      "3. Se l'ultimo deploy è rotto, si torna al precedente con Instant Rollback.",
    ],
    reason,
    ctx.site,
  );
  return { subject, html, text };
}

// ——— Registry ————————————————————————————————————————————————————————————————————

export type EmailData = {
  "richiesta-ricevuta": RichiestaRicevuta;
  "accesso-approvato": AccessoApprovato;
  "link-accesso": LinkAccesso;
  benvenuto: Benvenuto;
  "riepilogo-settimanale": RiepilogoSettimanale;
  "segnali-da-verificare": SegnaliDaVerificare;
  "sito-non-risponde": SitoNonRisponde;
};

export type EmailKind = keyof EmailData;

const renderers: { [K in EmailKind]: (d: EmailData[K], ctx: Ctx) => Rendered } = {
  "richiesta-ricevuta": richiestaRicevuta,
  "accesso-approvato": accessoApprovato,
  "link-accesso": linkAccesso,
  benvenuto,
  "riepilogo-settimanale": riepilogoSettimanale,
  "segnali-da-verificare": segnaliDaVerificare,
  "sito-non-risponde": sitoNonRisponde,
};

export const emailKinds = Object.keys(renderers) as EmailKind[];

export function renderEmail<K extends EmailKind>(kind: K, data: EmailData[K], opts?: RenderOptions): Rendered {
  return renderers[kind](data, context(opts));
}
