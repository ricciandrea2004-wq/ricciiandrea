// Renders the email images in public/email/ from the same Lottie files the site plays,
// with the same colour tokens: one animated GIF per drawing (plays once, stops on the
// finished drawing) and one PNG of the finished drawing, in the light and dark theme.
// Email clients ignore JavaScript and most CSS animation, so a GIF is the only motion
// that reaches an inbox; the PNG is what Outlook and reduced-motion readers get.
//
//   NODE_PATH=$(npm root -g) node scripts/email/build-assets.mjs
//
// Needs Playwright (Chromium) and ffmpeg; neither is a dependency of the site.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const outDir = path.join(root, "public/email");
fs.mkdirSync(outDir, { recursive: true });

// name: Lottie file; css size in the email (rendered at 2x for sharp screens).
const drawings = [
  { name: "logo", width: 150, height: 27.25 },
  { name: "richiesta", width: 64, height: 64 },
  { name: "verifica", width: 120, height: 84 },
  { name: "email", width: 56, height: 56 },
  { name: "fonte", width: 120, height: 84 },
  { name: "briefing", width: 120, height: 84 },
  { name: "avviso", width: 56, height: 56 },
];
const FPS = 25; // GIF frame delays are in hundredths of a second: 4 cs per frame.
const SCALE = 2;

const tokensCss = fs.readFileSync(path.join(root, "app/tokens.css"), "utf8");
const lottieCss = fs
  .readFileSync(path.join(root, "app/globals.css"), "utf8")
  .split("\n")
  .filter((l) => l.startsWith(".lottie .c-"))
  .join("\n");
const lottieJs = fs.readFileSync(path.join(root, "node_modules/lottie-web/build/player/lottie_svg.min.js"), "utf8");

function encodeGif(frameDir, file, loop) {
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(frameDir, "f%04d.png"),
    "-filter_complex", "[0:v]split[a][b];[a]palettegen=stats_mode=full:reserve_transparent=0[p];[b][p]paletteuse=dither=none",
    "-loop", loop ? "0" : "-1", file,
  ]);
}

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const suffix = theme === "dark" ? "-scuro" : "";
  for (const d of drawings) {
    const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 400, height: 300 } });
    const data = fs.readFileSync(path.join(root, `public/lottie/${d.name}.json`), "utf8");
    await page.setContent(`<!doctype html><html data-theme="${theme}"><head><style>${tokensCss}\n${lottieCss}
      body{margin:0;background:var(--bg)} #a{width:${d.width}px;height:${d.height}px;background:var(--bg)}</style></head>
      <body><div id="a" class="lottie"></div><script>${lottieJs}</script><script>
      window.anim = lottie.loadAnimation({ container: document.getElementById("a"), renderer: "svg", loop: false, autoplay: false, animationData: ${data} });
      </script></body></html>`);
    await page.waitForFunction(() => window.anim && window.anim.isLoaded);
    const { fr, total } = await page.evaluate(() => ({ fr: window.anim.frameRate, total: window.anim.totalFrames }));
    const last = total - 1;
    const count = Math.ceil((last / fr) * FPS) + 1;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "email-" + d.name));
    const el = await page.$("#a");
    for (let i = 0; i < count; i++) {
      const frame = Math.min(last, (i * fr) / FPS);
      await page.evaluate((f) => window.anim.goToAndStop(f, true), frame);
      await el.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, "0")}.png`) });
    }
    encodeGif(tmp, path.join(outDir, `${d.name}${suffix}.gif`), false);
    fs.copyFileSync(path.join(tmp, `f${String(count - 1).padStart(4, "0")}.png`), path.join(outDir, `${d.name}${suffix}.png`));
    fs.rmSync(tmp, { recursive: true });
    await page.close();
    console.log(theme, d.name, count, "frames");
  }

  // The breathing dot of a signal still "Da verificare", as in the workspace (StatusTag live):
  // opacity 0.3 → 1 → 0.3 over 2.8 s, ease-in-out, looping. Drawn on the yellow tag background.
  const page = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 100, height: 100 } });
  await page.setContent(`<!doctype html><html data-theme="${theme}"><head><style>${tokensCss}
    body{margin:0} #t{width:6px;height:6px;background:var(--tag-yellow-bg);display:flex}
    #d{width:6px;height:6px;border-radius:50%;background:var(--tag-yellow)}</style></head>
    <body><div id="t"><div id="d"></div></div></body></html>`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "email-dot"));
  const period = 2.8 * FPS;
  const el = await page.$("#t");
  for (let i = 0; i < period; i++) {
    const x = (1 - Math.cos((2 * Math.PI * i) / period)) / 2; // 0 → 1 → 0, eased
    await page.evaluate((o) => (document.getElementById("d").style.opacity = String(o)), 0.3 + 0.7 * x);
    await el.screenshot({ path: path.join(tmp, `f${String(i).padStart(4, "0")}.png`) });
  }
  encodeGif(tmp, path.join(outDir, `punto-da-verificare${suffix}.gif`), true);
  await page.evaluate(() => (document.getElementById("d").style.opacity = "1"));
  await el.screenshot({ path: path.join(outDir, `punto-da-verificare${suffix}.png`) });
  fs.rmSync(tmp, { recursive: true });
  await page.close();
  console.log(theme, "punto-da-verificare");
}
await browser.close();
