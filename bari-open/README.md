# Vista Bari

Cruscotto open data sulla mobilità di Bari: centraline semaforiche, flussi giornalieri e incidenti stradali 2025.

Basato solo su dataset pubblici di [opendata.comune.bari.it](https://opendata.comune.bari.it). Nessuna telecamera.

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
- `npm run build` — build di produzione

## Pagine

| Percorso | Contenuto |
|---|---|
| `/` | Hero e sintesi |
| `/mappa` | Mappa centraline + dettaglio flussi |
| `/andamento` | Serie cittadina e top incroci |
| `/sicurezza` | Overlay incidenti con filtri |
| `/fonti` | Licenze e privacy |
| `/per-il-comune` | Pitch per l’amministrazione |
