# competia.work · sito

Il sito completo di Competia in Next.js (App Router, TypeScript): pagine pubbliche, accesso, workspace `/app` e `/analytics`. Segue l'[albero delle pagine](../sitemap/README.md) approvato il 9 ottobre 2026 (fase F1) e il [design system](../design-system/README.md) ispirato a Notion.

La landing in `../landing/` resta separata: ci lavora il thread Supabase + Resend. Quando si unisce, la home di questo sito la sostituisce.

## Stato

- **Costruito**: tutte le 33 pagine F1, compilate con `next build` (48 percorsi generati) e provate in un browser (chiaro e scuro, desktop e mobile).
- **Dati del workspace**: di esempio, in `lib/demo-data.ts`. Nessuna scrittura: i bottoni che salverebbero (nuovo segnale, verifica, inviti, impostazioni) mostrano un avviso che il database non è ancora collegato.
- **Accesso**: `/app` è solo per chi ha fatto l'accesso (Supabase Auth, controllato in `middleware.ts`). Si entra con il link via email (predefinito), con il codice a 6 cifre della stessa email o con la password, se la persona ne ha impostata una. "Password dimenticata" manda un link per sceglierne una nuova. Gli account si creano solo su invito: chi non ha un account riceve la stessa risposta ma nessuna email. Vedi "Accesso" più sotto.
- **Richiedi accesso**: usa lo stesso endpoint `POST /api/access-request` della landing (copiato in `app/api/access-request/route.ts`), con le stesse variabili `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`.
- **Analytics**: `/analytics` legge Umami lato server ed è chiusa da HTTP Basic auth. Senza password impostata risponde 503.
- **Testi legali**: bozze con parti tra parentesi quadre da completare e far rivedere.
- **Da confermare**: l'indirizzo email pubblico in `app/(sito)/contatti/page.tsx` (ora `ciao@competia.work`).
- **F2 non costruite**: Per chi, Prezzi, Risorse, briefing condiviso `/b/[token]`, impostazioni Notifiche e Fatturazione.

## Pubblicazione

Il repository GitHub `ricciandrea2004-wq/ricciiandrea` è collegato al progetto Vercel `competia-work`: ogni push su `main` pubblica il sito in produzione su www.competia.work; gli altri rami creano un'anteprima.

## Avvio

```sh
npm install
npm run dev
```

Verifica: `npm run typecheck` e `npm run build`.

## Variabili d'ambiente

| Variabile | Serve a |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | salvare le richieste di accesso; login e sessione (senza, `/app` resta chiusa) |
| `RESEND_API_KEY`, `RESEND_FROM` | email di conferma della richiesta e tutte le email di `lib/email/` |
| `EMAIL_SENDING` | `off` (predefinito: nessun invio), `interno` (solo agli indirizzi del team), `on` (a tutti) |
| `EMAIL_INTERNAL_TO` | indirizzi del team, separati da virgola (predefinito `ciao@competia.work`) |
| `CRON_SECRET` | chiude le rotte `/api/cron/*`; Vercel Cron lo manda da solo |
| `EMAIL_EVENTS_SECRET` | chiude `POST /api/email/evento` |
| `SEND_EMAIL_HOOK_SECRET` | firma dell'hook "Send Email" di Supabase Auth (`v1,whsec_…`) |
| `EMAIL_SOGLIA_DA_VERIFICARE_GIORNI` | giorni prima dell'avviso sui segnali fermi (predefinito 3) |
| `ANALYTICS_USER`, `ANALYTICS_PASSWORD` | aprire `/analytics` |
| `UMAMI_API_URL`, `UMAMI_WEBSITE_ID` | dati di Umami |
| `UMAMI_API_KEY` (Umami Cloud) oppure `UMAMI_API_TOKEN` (self-hosted) | autenticazione verso Umami |
| `COMPETIA_API_TOKEN`, `CRON_SECRET` | API `/api/v1` e controllo giornaliero delle fonti |
| `COMPETIA_STORE`, `SUPABASE_SERVICE_ROLE_KEY`, `COMPETIA_ORGANIZATION_ID` | dati dell'API su Supabase invece dei dati di esempio |

## API e controllo delle fonti

`/api/v1` legge le pagine dei competitor (rispettando `robots.txt`), salva una copia del testo e crea un segnale quando qualcosa cambia. Vercel Cron la avvia una volta al giorno. Endpoint, esempi e cosa manca per il database vero: [docs/api.md](docs/api.md). Prova: `npm run test:scraper`.

## Struttura

```
app/
  layout.tsx, tokens.css, globals.css   radice, token del design system, stili
  (sito)/          pagine pubbliche con header e footer
  (accesso)/       accedi, controlla l'email, invito
  app/             workspace con sidebar (segnali, fonti, competitor, briefing, impostazioni)
  analytics/       dashboard interna Umami
  auth/confirm/    ritorno dal link dell'email: verifica il token e apre la sessione (auth/callback fa lo stesso)
  api/access-request/   endpoint del modulo di accesso
  api/v1/          API: competitor, fonti, segnali, controllo
  api/cron/scrape/ controllo giornaliero (Vercel Cron)
  api/email/       invii a evento (evento) e hook di Supabase Auth (auth-hook)
  api/cron/        riepilogo settimanale, segnali fermi, controllo del sito (orari in vercel.json)
  not-found.tsx, error.tsx, global-error.tsx, robots.ts, sitemap.ts
components/        componenti condivisi; workspace/ per la shell del workspace
components/motion/ animazioni (motion e Lottie)
lib/
  domain.ts        tipi ed etichette in italiano
  supabase/        client Supabase lato server (cookie della sessione)
  auth/actions.ts  accesso: link, codice, password, reset, uscita
  demo-data.ts     dati di esempio del workspace
  nav.ts           voci di navigazione
  umami.ts         lettura delle statistiche
  scraper/         lettura delle pagine: robots.txt, testo, confronto, segnali
  store/           dati dell'API: in memoria (demo) o Supabase
supabase/migrations/   schema SQL (da applicare con l'OK di Andrea)
docs/api.md      documentazione dell'API
  email/           template e invio delle email (vedi "Email")
middleware.ts      sessione obbligatoria su /app, password su /analytics
public/lottie/     animazioni Lottie (generate da scripts/lottie/build.mjs)
public/email/      GIF e PNG delle email (generate da scripts/email/build-assets.mjs)
```

`app/tokens.css` è una copia di `../design-system/tokens.css`: se cambia uno, va aggiornato l'altro.

## Animazioni

Due librerie, usate solo nelle pagine che ne hanno bisogno (le altre non le scaricano):

- **motion** (`components/motion/`): il segnale d'esempio in home e in /prodotto/segnali (il valore "prima" si barra, il "dopo" conta fino al nuovo prezzo, lo stato passa da "Da verificare" a "Verificato"), lo stesso prima/dopo nel dettaglio di un segnale, i numeri della Panoramica, il toast e il bottone "Copia link" del workspace.
- **lottie-react** (`components/motion/LottieAnimation.tsx`): disegni che si animano una volta quando entrano in vista. Il motore Lottie si scarica solo quando il disegno sta per comparire.

| File in `public/lottie/` | Origine | Dove |
|---|---|---|
| `fonte`, `verifica`, `briefing` | disegnati in codice | tre passi in home e in /prodotto |
| `richiesta` | disegnato in codice | /richiedi-accesso/grazie |
| `email`, `bussola`, `nessun-risultato`, `avviso` | useAnimations (MIT) | controlla l'email, 404, filtri senza risultati, errore |
| `logo` | disegnato in codice, lettere di Inter 700 vettorializzate | header (all'apertura della pagina) e footer (quando entra in vista) |

Animazioni che si ripetono (poche, lente, ferme quando la pagina non è visibile o con il movimento ridotto):

- home: il segnale d'esempio ruota fra prezzo, promozione e assortimento ogni 6 secondi circa; si ferma sotto il puntatore e quando si sceglie un esempio dai pallini;
- /prodotto/segnali: i quattro stati si illuminano a turno, ciascuno nel suo colore (`components/motion/StatusCycle.tsx`);
- workspace: lo stato "Da verificare" attuale di un segnale ha un punto che respira (`StatusTag live`); non nello storico né nell'attività.

I JSON si rigenerano con `node scripts/lottie/build.mjs`. I colori non sono fissati nei file: ogni livello ha una classe (`c-ink`, `c-accent`…) che `app/globals.css` collega ai token, così i disegni seguono il tema chiaro e scuro. Le fonti e la licenza dei file presi da useAnimations sono in `scripts/lottie/useanimations/README.md`.

Con `prefers-reduced-motion` nessun movimento: i disegni compaiono già finiti e i valori sono subito quelli finali.

## Logo e favicon

Il logo animato (`components/motion/AnimatedLogo.tsx`) dura 1,2 secondi e parte una volta: compare il simbolo "c.", si scrivono le lettere, poi i due punti blu cadono al loro posto. Il logo statico (`components/Logo.tsx`) resta sotto e tiene lo spazio: è quello che si vede senza JavaScript, con il movimento ridotto e dopo una navigazione interna. Le lettere del wordmark sono i contorni di Inter 700, presi una volta con `scripts/lottie/outline-wordmark.mjs` e salvati in `scripts/lottie/wordmark.json`.

Il simbolo usa i token `--logo-tile`, `--logo-glyph` e `--logo-dot`: scuro nel tema chiaro, chiaro nel tema scuro. `public/favicon.svg` fa lo stesso con `prefers-color-scheme`, così resta leggibile anche nelle schede scure; deve restare un SVG pulito, senza metadati. `favicon.ico`, `apple-touch-icon.png` e `app/opengraph-image.png` si rigenerano con `scripts/brand/render.mjs`.

## Email

Tutte le email stanno in `lib/email/` e usano lo stesso motore grafico del sito: `lib/email/tokens.ts` è generato da `app/tokens.css` (`npm run email:tokens`, oppure `node scripts/email/sync-tokens.mjs --check` per verificare), con Inter e la catena di font di Notion, i neutri caldi, l'accento blu e i colori dei tag con lo stesso significato del workspace. Ogni email ha la versione HTML e quella in solo testo.

| Template | Quando parte | Chi lo chiama |
|---|---|---|
| `richiesta-ricevuta` | qualcuno chiede l'accesso | `POST /api/email/evento`; la rotta `/api/access-request` manda ancora la sua conferma in testo (è di un altro thread, si collega quando la si tocca) |
| `accesso-approvato` | si apre un posto o un membro invita un collega | `POST /api/email/evento`, oppure l'hook di Supabase per gli inviti (`invite`) |
| `link-accesso` | accesso con link via email, con il codice a 6 cifre; stessa email con testi diversi per conferma dell'indirizzo e reset della password | hook "Send Email" di Supabase Auth → `/api/email/auth-hook` |
| `benvenuto` | primo accesso | `POST /api/email/evento` (da un webhook di Supabase o da `/auth/callback` quando l'accesso sarà collegato) |
| `riepilogo-settimanale` | ogni lunedì alle 7:00 UTC | Vercel Cron → `/api/cron/riepilogo-settimanale` |
| `segnali-da-verificare` | un segnale resta "Da verificare" oltre la soglia (una volta per segnale) | Vercel Cron ogni mattina → `/api/cron/segnali-da-verificare` |
| `sito-non-risponde` | una pagina pubblica non risponde 200 | Vercel Cron ogni mattina → `/api/cron/controllo-sito`, solo al team |

Interruttore: niente parte finché `EMAIL_SENDING` non è `interno` o `on`. Con `off` le email vengono preparate e scritte nei log, ma non inviate. Il riepilogo e l'avviso sui segnali fermi leggono i dati da `lib/email/data.ts`, che oggi restituisce zero destinatari perché il workspace usa ancora dati di esempio: quando arriva lo schema del database si sostituiscono le due funzioni con le query.

I cron sono una volta al giorno al massimo perché il piano Hobby di Vercel non ne permette di più frequenti. Il controllo del sito gira su Vercel stesso: vede pagine e deploy rotti, non un'interruzione completa di Vercel.

Animazioni: le email non eseguono JavaScript e quasi nessuna animazione CSS, quindi il movimento arriva con GIF generate dagli stessi file Lottie del sito e con gli stessi token (`NODE_PATH=$(npm root -g) node scripts/email/build-assets.mjs`, serve Playwright e ffmpeg). Il logo si disegna una volta come nell'header, ogni email ha il suo disegno (richiesta, verifica, email, fonte, briefing, avviso) e il tag "Da verificare" ha il punto che respira come nel workspace. Outlook su Windows riceve il PNG fermo (mostrerebbe solo il primo fotogramma), così come chi ha attivo il movimento ridotto; Apple Mail e iOS Mail ricevono la versione scura con il tema scuro.

Anteprime: `npm run email:anteprime` (con `NODE_PATH=$(npm root -g)` se Playwright è installato globalmente) scrive in `scripts/email/anteprime/` l'HTML, il testo e gli screenshot chiaro e scuro di ogni template, con i dati di `lib/email/esempi.ts`.

Per accendere:

1. `EMAIL_SENDING=interno` su Vercel: arrivano solo a `ciao@competia.work` (serve che la casella esista).
2. Login con link e reset della password: vedi "Accesso" qui sotto.
3. Eventi: un valore casuale in `EMAIL_EVENTS_SECRET`, lo stesso nel webhook che chiama `/api/email/evento`.
4. Quando è tutto provato, `EMAIL_SENDING=on`.

## Accesso

Tutto passa dal server (server action e `/auth/confirm`): le chiavi Supabase non arrivano al browser e la sessione sta in cookie.

| Pagina | Cosa fa |
|---|---|
| `/accedi` | link via email (predefinito) oppure email e password |
| `/accedi/controlla-email` | dopo l'invio; si può scrivere il codice a 6 cifre invece di aprire il link |
| `/accedi/password-dimenticata` | manda il link per scegliere una nuova password |
| `/accedi/nuova-password` | imposta la password (dal link di reset o da Impostazioni → Profilo) |
| `/auth/confirm` | dove arrivano i link delle email; poi porta a `next` (solo pagine `/app`) |

I link delle email li costruisce `/api/email/auth-hook` e puntano al sito da cui è partita la richiesta (produzione o anteprima), se Supabase lo ha nella lista degli URL permessi; altrimenti al Site URL.

Per accenderlo in Supabase (progetto `competia`):

1. Authentication → URL Configuration: Site URL `https://www.competia.work`; Redirect URLs `https://www.competia.work/**` e, per le anteprime, `https://*-andrea-riccis-projects-6714dfee.vercel.app/**`.
2. Authentication → Hooks → Send Email → HTTPS `https://www.competia.work/api/email/auth-hook`; il segreto generato va in `SEND_EMAIL_HOOK_SECRET` su Vercel (Production e Preview).
3. Authentication → Sign In / Providers → Email: lasciare disattivate le iscrizioni libere ("Allow new users to sign up"): gli account si creano con Authentication → Users → Invite user.
4. `EMAIL_SENDING` su Vercel: con `off` l'hook risponde 503 e chi prova a entrare vede "Non siamo riusciti a mandare l'email"; con `interno` arrivano solo agli indirizzi di `EMAIL_INTERNAL_TO`; con `on` a tutti.

## Scorciatoie nel workspace

- `⌘K` / `Ctrl K`: cerca segnali, fonti, competitor e pagine.
- `⌘\` / `Ctrl \`: chiude e riapre la barra laterale.

## Prossimi passi

1. Supabase Auth con link via email, sessione nel middleware e protezione di `/app`.
2. Schema del database (organizzazioni, membri, competitor, fonti, segnali, briefing) con RLS, al posto di `lib/demo-data.ts`.
3. Unire la landing in questo progetto e pubblicare.
