# competia.work · sito

Il sito completo di Competia in Next.js (App Router, TypeScript): pagine pubbliche, accesso, workspace `/app` e `/analytics`. Segue l'[albero delle pagine](../sitemap/README.md) approvato il 9 ottobre 2026 (fase F1) e il [design system](../design-system/README.md) ispirato a Notion.

La landing in `../landing/` resta separata: ci lavora il thread Supabase + Resend. Quando si unisce, la home di questo sito la sostituisce.

## Stato

- **Costruito**: tutte le 33 pagine F1, compilate con `next build` (48 percorsi generati) e provate in un browser (chiaro e scuro, desktop e mobile).
- **Dati del workspace**: di esempio, in `lib/demo-data.ts`. Nessuna scrittura: i bottoni che salverebbero (nuovo segnale, verifica, inviti, impostazioni) mostrano un avviso che il database non è ancora collegato.
- **Accesso**: le pagine ci sono, ma il login con link via email (Supabase Auth) non è collegato e `/app` non è protetta. Il banner giallo in cima al workspace lo dice.
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
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | salvare le richieste di accesso |
| `RESEND_API_KEY`, `RESEND_FROM` | email di conferma della richiesta |
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
  auth/callback/   ritorno dal link di accesso (per ora solo redirect)
  api/access-request/   endpoint del modulo di accesso
  api/v1/          API: competitor, fonti, segnali, controllo
  api/cron/scrape/ controllo giornaliero (Vercel Cron)
  not-found.tsx, error.tsx, global-error.tsx, robots.ts, sitemap.ts
components/        componenti condivisi; workspace/ per la shell del workspace
components/motion/ animazioni (motion e Lottie)
lib/
  domain.ts        tipi ed etichette in italiano
  demo-data.ts     dati di esempio del workspace
  nav.ts           voci di navigazione
  umami.ts         lettura delle statistiche
  scraper/         lettura delle pagine: robots.txt, testo, confronto, segnali
  store/           dati dell'API: in memoria (demo) o Supabase
supabase/migrations/   schema SQL (da applicare con l'OK di Andrea)
docs/api.md      documentazione dell'API
middleware.ts      password su /analytics
public/lottie/     animazioni Lottie (generate da scripts/lottie/build.mjs)
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

## Scorciatoie nel workspace

- `⌘K` / `Ctrl K`: cerca segnali, fonti, competitor e pagine.
- `⌘\` / `Ctrl \`: chiude e riapre la barra laterale.

## Prossimi passi

1. Supabase Auth con link via email, sessione nel middleware e protezione di `/app`.
2. Schema del database (organizzazioni, membri, competitor, fonti, segnali, briefing) con RLS, al posto di `lib/demo-data.ts`.
3. Unire la landing in questo progetto e pubblicare.
