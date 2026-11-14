# Vista Bari

Cruscotto open data sulla mobilità di Bari: centraline semaforiche, flussi giornalieri e incidenti stradali 2025.

Basato solo su dataset pubblici di [opendata.comune.bari.it](https://opendata.comune.bari.it). Nessuna telecamera.

## Deploy (Vercel / competia.work)

Root Directory del progetto: **`bari-open`**. Impostalo così su Vercel (o sul dominio **competia.work**) affinché build e output puntino a questa app Next.js, non alla root del monorepo.

## Avvio

```sh
cd bari-open
npm install
npm run sync:opendata
npm run dev
```

Apri [http://localhost:3100](http://localhost:3100).

## Script

- `npm run sync:opendata` — scarica e normalizza i dataset CKAN in `data/vista-bundle.json`
- `npm run test:smoke` — verifica forma e densità del bundle
- `npm run typecheck` — controllo TypeScript (`tsc --noEmit`)
- `npm run build` — build di produzione
- `npm run start` — server di produzione sulla porta 3100

## Pagine

| Percorso | Contenuto |
|---|---|
| `/` | Hero, sintesi e insight dal briefing |
| `/mappa` | Mappa centraline + dettaglio flussi |
| `/andamento` | Serie cittadina e top incroci |
| `/sicurezza` | Overlay incidenti con filtri |
| `/briefing` | Briefing settimanale stampabile (finding, anomalie, hotspot) |
| `/fonti` | Licenze, privacy e fonti live da integrare |
| `/per-il-comune` | Pitch per l’amministrazione |
