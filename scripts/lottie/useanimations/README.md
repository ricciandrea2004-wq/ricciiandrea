# Animazioni da useAnimations

I file JSON in questa cartella sono animazioni Lottie originali della libreria
[useAnimations](https://useanimations.com), prese dal pacchetto npm
[`react-useanimations`](https://github.com/useAnimations/react-useanimations) versione 2.10.0
(`lib/<nome>/<nome>.json`). Il pacchetto è pubblicato con licenza MIT: si possono usare,
modificare e pubblicare anche a fini commerciali, mantenendo l'avviso qui sotto.

| File | Diventa | Dove |
|---|---|---|
| `mail.json` | `public/lottie/email.json` | /accedi/controlla-email |
| `explore.json` | `public/lottie/bussola.json` | pagina 404 |
| `searchToX.json` | `public/lottie/nessun-risultato.json` | /app/segnali, filtri senza risultati |
| `alertTriangle.json` | `public/lottie/avviso.json` | pagina di errore |

`scripts/lottie/build.mjs` li adatta al design system: tratto da 2 a 1.5 e colore dai token
invece del nero. Gli originali qui restano intatti.

## Licenza

MIT License

Copyright (c) useAnimations (Tuan Phung, Marek Feikus)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
