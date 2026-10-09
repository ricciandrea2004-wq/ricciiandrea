# API di Competia (v1)

Prima versione dell'API che legge le pagine dei competitor e trasforma i cambiamenti in segnali da verificare.

## Come funziona

1. Una **fonte** è una pagina pubblica di un competitor: indirizzo, competitor, tipo (`price`, `promotion`, `assortment`, `news`), stato e ora dell'ultimo controllo. Si può indicare un selettore CSS (per esempio `#prezzi`) per guardare solo una parte della pagina.
2. Il **controllo** scarica la pagina con `fetch`, dopo aver letto `robots.txt` del sito. Tiene solo il testo (niente script, stili, menu nascosti), ne calcola l'hash SHA-256 e lo confronta con la copia precedente.
3. Se il testo è cambiato nasce un **segnale** con stato `to_verify`, le righe tolte in `before` e quelle nuove in `after`. Per le fonti di prezzo il titolo riporta il prezzo vecchio e quello nuovo, se li trova. Il primo controllo di una fonte salva solo la copia di partenza.
4. Una volta al giorno **Vercel Cron** chiama `/api/cron/scrape`, che controlla fino a 10 fonti, partendo da quelle controllate meno di recente.

Regole del controllo:

- Agente `CompetiaBot/0.1 (+https://www.competia.work/contatti)`. In `robots.txt` vale il gruppo `competiabot`, altrimenti `*`. Se `robots.txt` non risponde (errore 5xx o rete) la pagina non si legge; se manca (4xx) si legge.
- Almeno 5 secondi tra due richieste allo stesso sito, o il `Crawl-delay` del sito se è più lungo (fino a 30 s).
- Ogni giro si ferma da solo dopo circa 45 secondi; le fonti rimaste passano al giro successivo.
- Solo indirizzi pubblici `http`/`https` sulle porte 80 e 443: niente localhost, reti private o credenziali nell'indirizzo. Il controllo si ripete a ogni reindirizzamento.
- Pagine fino a 2 MB, 15 secondi di attesa al massimo. I PDF non sono ancora letti.
- Un cambiamento solo nell'ordine delle righe non diventa un segnale.

## Autenticazione

Tutte le rotte `/api/v1` chiedono un token:

```
Authorization: Bearer <COMPETIA_API_TOKEN>
```

Il token sta nella variabile d'ambiente `COMPETIA_API_TOKEN` su Vercel e non va mai scritto nel codice. Senza la variabile le rotte rispondono `503 not_configured`. Anche le letture chiedono il token, perché elenchi di competitor e fonti sono dati riservati del cliente.

Per creare un token: `openssl rand -hex 32`.

## Risposte

Successo:

```json
{ "ok": true, "data": { }, "meta": { "store": "demo" } }
```

`meta.store` dice dove stanno i dati: `demo` (in memoria, dati di esempio) o `supabase`.

Errore:

```json
{ "ok": false, "error": { "code": "bad_request", "message": "Dati non validi.", "details": { "url": "URL non valido." } } }
```

| Codice | HTTP | Quando |
|---|---|---|
| `unauthorized` | 401 | token mancante o sbagliato |
| `bad_request` | 400 | corpo o parametri non validi; `details` dice quali |
| `not_found` | 404 | fonte o competitor inesistente |
| `conflict` | 409 | la fonte esiste già per quel competitor |
| `not_configured` | 503 | manca la variabile del token |
| `internal` | 500 | errore inatteso (finisce nei log di Vercel) |

## Endpoint

Negli esempi `$API` è `https://www.competia.work/api/v1` e `$TOKEN` il token.

### `GET /competitors`

Elenco dei competitor.

```sh
curl -H "Authorization: Bearer $TOKEN" $API/competitors
```

### `GET /sources`

Elenco delle fonti. Filtri facoltativi: `competitorId`, `status` (`active`, `paused`, `error`, `blocked`).

```sh
curl -H "Authorization: Bearer $TOKEN" "$API/sources?competitorId=vela"
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "src-vela-prezzi",
      "competitorId": "vela",
      "label": "Pagina prezzi pubblica",
      "category": "price",
      "url": "https://vela.example/prezzi",
      "addedAt": "2026-09-12T09:00:00Z",
      "lastObservedAt": "2026-10-02T08:30:00Z",
      "note": "Mostra i tre piani mensili. I prezzi sono IVA esclusa.",
      "status": "active",
      "lastCheckedAt": "2026-10-02T08:30:00Z",
      "lastError": null,
      "selector": null
    }
  ],
  "meta": { "store": "demo" }
}
```

### `POST /sources`

Aggiunge una fonte. Obbligatori `competitorId`, `url`, `category`; facoltativi `label`, `note`, `selector`.

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"competitorId":"vela","url":"https://vela.example/prezzi-annuali","category":"price","label":"Prezzi annuali","selector":"main"}' \
  $API/sources
```

Risponde `201` con la fonte creata (stato `active`, `lastCheckedAt: null`).

### `GET /sources/{id}`

Una fonte, con l'ultima copia salvata (`latestSnapshot`: ora, URL finale, codice HTTP, hash, titolo e i primi 1000 caratteri del testo).

### `PATCH /sources/{id}`

Mette in pausa o riattiva una fonte (`status`: `active` o `paused`), oppure cambia `label`, `note`, `selector` (`null` per toglierlo).

```sh
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"paused"}' $API/sources/src-vela-blog
```

### `GET /signals`

Segnali dal più recente. Filtri: `status` (`to_verify`, `verified`, `in_briefing`, `discarded`), `category`, `competitorId`, `sourceId`, `since` (data ISO), `limit` (1–200, predefinito 50).

```sh
curl -H "Authorization: Bearer $TOKEN" "$API/signals?status=to_verify&since=2026-10-01"
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "s-d32ad1e1",
      "competitorId": "vela",
      "category": "price",
      "title": "Vela Software, Pagina prezzi pubblica: prezzo da 52 € a 48 €",
      "before": "Pro: 52 € al mese",
      "after": "Pro: 48 € al mese",
      "sourceId": "src-vela-prezzi",
      "observedAt": "2026-10-09T22:23:08.197Z",
      "interpretation": "Rilevato automaticamente dal confronto con la copia precedente della pagina. Da verificare.",
      "status": "to_verify",
      "history": [{ "status": "to_verify", "at": "2026-10-09T22:23:08.197Z", "by": "Competia (automatico)" }]
    }
  ],
  "meta": { "store": "demo" }
}
```

### `POST /scrape`

Avvia subito un controllo. Corpo facoltativo: `sourceIds` (solo quelle fonti) e `limit` (1–25, predefinito 10).

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"sourceIds":["src-vela-prezzi"]}' $API/scrape
```

```json
{
  "ok": true,
  "data": {
    "startedAt": "2026-10-10T05:00:03.120Z",
    "durationMs": 812,
    "checked": 1,
    "changed": 0,
    "results": [
      {
        "sourceId": "src-vela-prezzi",
        "url": "https://vela.example/prezzi",
        "outcome": "baseline",
        "message": "Prima copia salvata: i cambiamenti si vedono dal prossimo controllo.",
        "durationMs": 790
      }
    ]
  },
  "meta": { "store": "demo" }
}
```

`outcome` per fonte: `baseline` (prima copia), `unchanged`, `changed` (con `signalId`), `blocked` (robots.txt), `error` (con il motivo in `message`), `skipped` (tempo del giro finito).

### `GET /api/cron/scrape` (fuori da v1)

Solo per Vercel Cron, ogni giorno alle 05:00 UTC (`vercel.json`). Vercel manda da solo `Authorization: Bearer $CRON_SECRET` quando la variabile `CRON_SECRET` è impostata; senza, la rotta risponde 503 e non fa niente.

Sul piano Hobby di Vercel un cron può girare al massimo una volta al giorno, con un orario preciso solo all'ora (05:00–05:59), e una funzione dura al massimo 300 secondi. Le rotte di controllo hanno `maxDuration = 60` e si fermano da sole dopo 45 secondi.

## Variabili d'ambiente

| Variabile | Serve a |
|---|---|
| `COMPETIA_API_TOKEN` | token delle rotte `/api/v1` |
| `CRON_SECRET` | protegge `/api/cron/scrape` |
| `COMPETIA_STORE` | `supabase` per usare il database; altrimenti dati di esempio in memoria |
| `SUPABASE_URL` | già presente per il modulo di accesso |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave di servizio, solo lato server, mai nel browser |
| `COMPETIA_ORGANIZATION_ID` | l'organizzazione a cui appartengono i dati letti e scritti dall'API |

## Prova locale

```sh
npm run test:scraper   # robots.txt, ritardo, copia, confronto, segnale, PDF, selettore, indirizzi privati
COMPETIA_API_TOKEN=prova npm run dev
curl -H "Authorization: Bearer prova" localhost:3000/api/v1/sources
```

## Cosa manca prima di usarla sul database vero

1. **Applicare la migrazione** `supabase/migrations/20261010090000_sources_and_scraping.sql` (tabelle `organizations`, `competitors`, `sources`, `source_snapshots`, `signals`, `signal_status_changes`, con RLS attiva e nessuna policy: solo la chiave di servizio legge e scrive). Non è stata applicata: serve l'OK di Andrea.
2. **Creare l'organizzazione** e i competitor (riga in `organizations`, poi `COMPETIA_ORGANIZATION_ID`).
3. **Impostare su Vercel** `COMPETIA_API_TOKEN`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `COMPETIA_ORGANIZATION_ID` e `COMPETIA_STORE=supabase`, poi ripubblicare.
4. **Collegare il workspace**: le pagine di `/app` leggono ancora `lib/demo-data.ts`. Vanno spostate su `getStore()`.
5. **Login e permessi per organizzazione**: oggi c'è un solo token per un'organizzazione. Con Supabase Auth servono policy RLS per membro e token per organizzazione.
6. Lo store Supabase (`lib/store/supabase.ts`) è scritto e compilato ma non ancora provato contro il database: va provato subito dopo la migrazione.

Senza questi passi, in produzione l'API usa i dati di esempio in memoria: ciò che si aggiunge vive solo finché resta accesa quella istanza della funzione.

## Limiti noti

- Le pagine costruite solo con JavaScript risultano vuote (errore "nessun testo leggibile"). Per quelle servirà un browser headless o un servizio gestito: da valutare fonte per fonte.
- I PDF (listini) non sono ancora letti.
- Il controllo DNS anti-indirizzi privati avviene prima della richiesta; un dominio che cambia indirizzo nel mezzo (DNS rebinding) non è ancora coperto.
- Si tengono le ultime 30 copie per fonte solo dopo aver chiamato `prune_source_snapshots()` (non ancora programmata).
