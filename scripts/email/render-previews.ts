// Renders every template with sample data into scripts/email/anteprime/: HTML (images from
// https://www.competia.work/email, as in a real email), plain text and, with Playwright available,
// a screenshot in the light and dark theme (taken with the local images in public/email).
//
//   npm run email:anteprime
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { emailKinds, renderEmail } from "../../lib/email/templates";
import { esempi } from "../../lib/email/esempi";

const root = path.resolve(__dirname, "../..");
const out = path.join(root, "scripts/email/anteprime");
fs.mkdirSync(out, { recursive: true });
const local = fs.mkdtempSync(path.join(os.tmpdir(), "anteprime-"));

const index: string[] = [];
for (const kind of emailKinds) {
  const email = renderEmail(kind, esempi[kind] as never);
  fs.writeFileSync(path.join(out, `${kind}.html`), email.html);
  const preview = renderEmail(kind, esempi[kind] as never, { assetBase: `file://${path.join(root, "public/email")}` });
  fs.writeFileSync(path.join(local, `${kind}.html`), preview.html);
  fs.writeFileSync(path.join(out, `${kind}.txt`), `Oggetto: ${email.subject}\n\n${email.text}`);
  index.push(`${kind}\t${email.subject}`);
  console.log(kind, "·", email.subject, "·", Math.round(email.html.length / 1024), "KB");
}
fs.writeFileSync(path.join(out, "oggetti.tsv"), index.join("\n") + "\n");

async function screenshots() {
  let chromium;
  try {
    chromium = createRequire(__filename)("playwright").chromium;
  } catch {
    console.log("Playwright non trovato: niente screenshot (NODE_PATH=$(npm root -g) per usarlo).");
    return;
  }
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"] as const) {
    // Reduced motion: the screenshot shows the finished drawings (the PNGs), not the GIFs' first frame.
    const page = await browser.newPage({ viewport: { width: 640, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
    for (const kind of emailKinds) {
      await page.goto(`file://${path.join(local, `${kind}.html`)}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, `${kind}${scheme === "dark" ? "-scuro" : ""}.png`), fullPage: true });
    }
    await page.close();
  }
  await browser.close();
  fs.rmSync(local, { recursive: true });
}

screenshots();
