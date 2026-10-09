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
  not-found.tsx, error.tsx, global-error.tsx, robots.ts, sitemap.ts
components/        componenti condivisi; workspace/ per la shell del workspace
lib/
  domain.ts        tipi ed etichette in italiano
  demo-data.ts     dati di esempio del workspace
  nav.ts           voci di navigazione
  umami.ts         lettura delle statistiche
middleware.ts      password su /analytics
```

`app/tokens.css` è una copia di `../design-system/tokens.css`: se cambia uno, va aggiornato l'altro.

## Scorciatoie nel workspace

- `⌘K` / `Ctrl K`: cerca segnali, fonti, competitor e pagine.
- `⌘\` / `Ctrl \`: chiude e riapre la barra laterale.

## Prossimi passi

1. Supabase Auth con link via email, sessione nel middleware e protezione di `/app`.
2. Schema del database (organizzazioni, membri, competitor, fonti, segnali, briefing) con RLS, al posto di `lib/demo-data.ts`.
3. Unire la landing in questo progetto e pubblicare.
