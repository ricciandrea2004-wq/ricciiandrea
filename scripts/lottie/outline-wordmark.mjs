// Turns the wordmark "competia.work" into outlines for the animated logo.
//
//   npm i --no-save opentype.js@1.3.4
//   node scripts/lottie/outline-wordmark.mjs path/to/Inter-Bold.ttf
//
// The font is the Inter 700 that Google Fonts serves to the site, so the outlines
// match the text in the header. The result, wordmark.json, is checked in: build.mjs
// reads it and needs neither the font nor opentype.js.
//
// Units are CSS pixels inside the .logo box, measured in Chromium:
// text at 17px with letter-spacing -0.025em, starting 30px from the left, baseline at 19px.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const TEXT = "competia.work";
const SIZE = 17;
const TRACKING = -0.025 * SIZE;
const LEFT = 30;
const BASELINE = 19;

const font = opentype.loadSync(process.argv[2]);
const scale = SIZE / font.unitsPerEm;
const round = (n) => Math.round(n * 1000) / 1000;
const pt = (x, y) => [round(x), round(y)];

// One closed contour in the form Lottie takes: vertices, and in/out tangents relative to them.
function contours(commands) {
  const out = [];
  let cur = null;
  let last = null;
  const close = () => {
    if (!cur) return;
    const n = cur.v.length;
    // The closing segment often lands back on the first point: merge the two.
    const [fx, fy] = cur.v[0];
    const [lx, ly] = cur.v[n - 1];
    if (n > 1 && Math.abs(fx - lx) < 1e-6 && Math.abs(fy - ly) < 1e-6) {
      cur.i[0] = cur.i[n - 1];
      cur.v.pop();
      cur.i.pop();
      cur.o.pop();
    }
    out.push(cur);
    cur = null;
  };
  for (const c of commands) {
    if (c.type === "M") {
      close();
      cur = { v: [[c.x, c.y]], i: [[0, 0]], o: [[0, 0]] };
    } else if (c.type === "L") {
      cur.v.push([c.x, c.y]);
      cur.i.push([0, 0]);
      cur.o.push([0, 0]);
    } else if (c.type === "Q" || c.type === "C") {
      // Quadratic curves become cubic ones.
      const [x0, y0] = last;
      const c1 = c.type === "Q" ? [x0 + (2 / 3) * (c.x1 - x0), y0 + (2 / 3) * (c.y1 - y0)] : [c.x1, c.y1];
      const c2 = c.type === "Q" ? [c.x + (2 / 3) * (c.x1 - c.x), c.y + (2 / 3) * (c.y1 - c.y)] : [c.x2, c.y2];
      cur.o[cur.o.length - 1] = [c1[0] - x0, c1[1] - y0];
      cur.v.push([c.x, c.y]);
      cur.i.push([c2[0] - c.x, c2[1] - c.y]);
      cur.o.push([0, 0]);
    } else if (c.type === "Z") {
      close();
      continue;
    }
    last = cur.v[cur.v.length - 1];
  }
  close();
  return out.map((k) => ({ v: k.v.map(([x, y]) => pt(x, y)), i: k.i.map(([x, y]) => pt(x, y)), o: k.o.map(([x, y]) => pt(x, y)) }));
}

const glyphs = [];
let x = LEFT;
let prev = null;
for (const ch of TEXT) {
  const g = font.charToGlyph(ch);
  if (prev) x += font.getKerningValue(prev, g) * scale;
  const p = g.getPath(x, BASELINE, SIZE);
  const box = p.getBoundingBox();
  glyphs.push({ ch, x: round(x), box: [round(box.x1), round(box.y1), round(box.x2), round(box.y2)], contours: contours(p.commands) });
  x += g.advanceWidth * scale + TRACKING;
  prev = g;
}

const out = path.join(here, "wordmark.json");
fs.writeFileSync(out, JSON.stringify({ text: TEXT, size: SIZE, width: round(x - LEFT), glyphs }));
console.log(`Written ${path.relative(process.cwd(), out)}: ${glyphs.length} glyphs, text width ${round(x - LEFT)}px`);
