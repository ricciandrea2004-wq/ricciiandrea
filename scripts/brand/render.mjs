// Renders the brand images from public/favicon.svg and og.html with Chromium.
//
//   node scripts/brand/render.mjs "$PWD/scripts/brand/og.html" public/favicon.svg <out-dir>
//
// Playwright is not a dependency of the site: run it where Playwright is installed.
// Out come opengraph-image.png (copy to app/), apple-touch-icon.png and the 16/32/48 px
// favicons, which go into public/favicon.ico (one .ico with the three sizes).
import { chromium } from "playwright";
import fs from "node:fs";
const [og, fav, outDir] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto("file://" + og, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
console.log("inter loaded:", await p.evaluate(() => document.fonts.check("700 76px Inter")));
await p.screenshot({ path: outDir + "/opengraph-image.png" });
const svg = fs.readFileSync(fav, "utf8");
for (const [name, size, full] of [["apple-touch-icon.png", 180, true], ["icon-512.png", 512, false], ["favicon-48.png", 48, false], ["favicon-32.png", 32, false], ["favicon-16.png", 16, false]]) {
  const q = await b.newPage({ viewport: { width: size, height: size }, colorScheme: "light" });
  // The touch icon is a full square: iOS rounds the corners itself.
  const body = full
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"><rect width="64" height="64" fill="#37352f"/><path d="M38.72 41A14 14 0 1 1 38.72 23" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" transform="translate(32 32) scale(.78) translate(-32 -32)"/><circle cx="47" cy="43" r="4.5" fill="#5aa5e6" transform="translate(32 32) scale(.78) translate(-32 -32)"/></svg>`
    : svg.replace("<svg ", `<svg width="${size}" height="${size}" `);
  await q.setContent(`<html><body style="margin:0;background:transparent">${body}</body></html>`);
  await q.screenshot({ path: outDir + "/" + name, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await q.close();
}
await b.close();
