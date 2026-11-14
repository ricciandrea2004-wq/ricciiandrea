# Deploy Vista Bari su competia.work

Il progetto Vercel **competia-work** oggi builda il sito Competia dalla root del repo.
Per far puntare **www.competia.work** a Vista Bari:

## Impostazione (una volta)

1. Apri il progetto Vercel `competia-work`
2. **Settings → General → Root Directory** → imposta `bari-open`
3. Framework: Next.js (auto)
4. Build Command: `npm run build` (il `prebuild` sincronizza gli open data)
5. Install Command: `npm install`
6. Salva e ridistribuisci il branch di produzione (`main` dopo il merge)

I cron Competia in `/vercel.json` root **non** si applicano più quando Root Directory è `bari-open`.

## Verifica

- Preview sulla PR: URL Vercel dell’app Vista Bari
- Produzione: `https://www.competia.work` mostra home “Vista Bari”, non Competia

## Rollback

Ripristina Root Directory a `.` (vuoto) e ridistribuisci.
