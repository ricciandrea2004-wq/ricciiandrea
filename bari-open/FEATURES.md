# Vista Bari — 50 features

Checklist of shipped, user-visible features (UX / API / data). All items below are implemented in this tree.

1. [x] **Live bus count badge** in header (AMTAB GTFS-RT, 30s refresh)
2. [x] **Live bus route filter** on `/ora` (dropdown per linea)
3. [x] **Auto-refresh countdown** on `/ora` (secondi al prossimo poll)
4. [x] **Open-Meteo weather widget** on home (temp / pioggia / vento)
5. [x] **ARPA air quality card** on home (graceful fail se ARPA down)
6. [x] **Export CSV** top intersections (`/api/export/intersections` + CTA Andamento)
7. [x] **Export JSON summary API** `/api/export/summary`
8. [x] **Multi-year accidents toggle** on Sicurezza (merge 2024 se CKAN espone il dataset; altrimenti messaggio “solo 2025”)
9. [x] **District ZIP→GeoJSON** — sync già tenta GeoJSON circoscrizioni; se solo ZIP/shape, skip graceful + card home “Districts n/d”
10. [x] **Data freshness SLA warning** se sync &gt; 7 giorni (`freshness.ts`, banner home, footer)
11. [x] **Briefing print stylesheet polish** (nasconde chrome, badge severità, finding break-avoid)
12. [x] **Briefing date-range selector** (ultimi 7 / 14 / 30 giorni)
13. [x] **Anomaly severity badges** (bassa / media / alta)
14. [x] **Hotspot map mini-links** aprono `/mappa` in nuova scheda
15. [x] **Weekday vs weekend chart** on `/andamento`
16. [x] **MoM city traffic delta** KPI on Andamento + summary API
17. [x] **Top improving / worsening intersections** lists (14g vs 14g)
18. [x] **Injury rate % KPI** on home
19. [x] **Briefing markdown download** `/api/briefing/markdown`
20. [x] **“Copia finding” clipboard buttons** sul briefing
21. [x] **Fullscreen map toggle**
22. [x] **Locate me** (geolocation) button
23. [x] **Measure distance** tra due click (km)
24. [x] **Legend panel** sulla mappa
25. [x] **Keyboard shortcut `/`** per focus ricerca
26. [x] **Recent selections history** (localStorage)
27. [x] **Bookmark centralina** (localStorage)
28. [x] **Compare two centraline** side-by-side panel
29. [x] **Heat intensity mode** per marker traffico
30. [x] **Filter centraline by min daily flow**
31. [x] **Copy coordinates** button
32. [x] **Open in OSM / Google Maps** links
33. [x] **Mobile bottom-sheet** per centralina selezionata
34. [x] **Accident cluster click** espande elenco eventi
35. [x] **Layer opacity slider**
36. [x] **Filter by road type** (Sicurezza)
37. [x] **Filter by pavement wet/dry**
38. [x] **Filter by property damage**
39. [x] **Monthly accident histogram**
40. [x] **Top dangerous period** — open data senza ora → distribuzione per **giorno della settimana** (documentato in UI)
41. [x] **Safety score per centralina** (tabella + tooltip mappa)
42. [x] **CSV export filtered accidents** `/api/export/accidents`
43. [x] **Accessibility**: skip link, `:focus-visible`, `aria-pressed` su chip, `aria-label` toolbar
44. [x] **Italian/English toggle** per chrome strings (`lib/i18n.tsx`)
45. [x] **PWA manifest + icons** (`manifest.webmanifest`, icon-192/512)
46. [x] **robots.txt + sitemap** (`public/robots.txt`, `app/sitemap.ts`)
47. [x] **`/stato` status page** (età sync + health AMTAB/ARPA/meteo) + `/api/stato`
48. [x] **Newsletter-style email HTML preview** `/briefing/email` (no send)
49. [x] **Onboarding tips** first visit (localStorage)
50. [x] **Keyboard nav help modal** (`?`)

## Polish

- Empty states su filtri/live senza dati
- Loading skeletons su meteo/aria/stato/live
- Error boundaries sui feed live (meteo, aria, bus map)
