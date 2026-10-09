// Builds the Lottie animations in public/lottie/.
//
//   node scripts/lottie/build.mjs
//
// Two kinds of file come out of here:
// - Animations drawn in code below (fonte, verifica, briefing, richiesta), in the
//   design system's line style.
// - Animations from useAnimations (MIT, see useanimations/README.md), adapted to the
//   design system: thinner stroke and a colour class instead of black.
//
// Colours are never final in the JSON. Every layer carries a class (c-ink, c-accent…)
// and app/globals.css maps it to a token, so the same file follows the light and
// dark theme.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "../../public/lottie");
fs.mkdirSync(out, { recursive: true });

const FR = 60;

// Light-theme colours, used only if the stylesheet is missing.
const COLORS = {
  ink: [0.6, 0.6, 0.59, 1],
  faint: [0.85, 0.85, 0.83, 1],
  paper: [1, 1, 1, 1],
  subtle: [0.97, 0.97, 0.96, 1],
  accent: [0.1, 0.44, 0.82, 1],
  "accent-soft": [0.9, 0.94, 0.98, 1],
  ok: [0.27, 0.51, 0.38, 1],
  "on-ok": [1, 1, 1, 1],
  text: [0.22, 0.21, 0.18, 1],
  "logo-tile": [0.22, 0.21, 0.18, 1],
  "logo-glyph": [1, 1, 1, 1],
  "logo-dot": [0.35, 0.65, 0.9, 1],
};

// --- keyframes -------------------------------------------------------------

const arr = (v) => (Array.isArray(v) ? v : [v]);
const fixed = (k) => ({ a: 0, k });

// The design system's --ease-out: cubic-bezier(0.2, 0, 0, 1).
const EASE = { o: { x: [0.2], y: [0] }, i: { x: [0], y: [1] } };

// keys: [[frame, value], ...]
function anim(keys) {
  return {
    a: 1,
    k: keys.map(([t, v], n) => (n === keys.length - 1 ? { t, s: arr(v) } : { t, s: arr(v), ...EASE })),
  };
}

// --- shapes ----------------------------------------------------------------

const rect = (cx, cy, w, h, r) => ({ ty: "rc", d: 1, p: fixed([cx, cy]), s: fixed([w, h]), r: fixed(r) });
const circle = (cx, cy, d) => ({ ty: "el", d: 1, p: fixed([cx, cy]), s: fixed([d, d]) });
const zero = (pts) => pts.map(() => [0, 0]);
const line = (pts, closed = false) => ({ ty: "sh", ks: fixed({ i: zero(pts), o: zero(pts), v: pts, c: closed }) });
const curve = (v, i, o) => ({ ty: "sh", ks: fixed({ i, o, v, c: false }) });
const stroke = (w) => ({ ty: "st", c: fixed([0, 0, 0, 1]), o: fixed(100), w: fixed(w), lc: 2, lj: 2, ml: 4 });
const fill = () => ({ ty: "fl", c: fixed([0, 0, 0, 1]), o: fixed(100), r: 1 });
// Draws the path from start to end between two frames.
const draw = (from, to) => ({
  ty: "tm",
  s: fixed(0),
  e: anim([
    [from, 0],
    [to, 100],
  ]),
  o: fixed(0),
  m: 1,
});

function group(items, tr = {}) {
  return {
    ty: "gr",
    it: [
      ...items,
      {
        ty: "tr",
        p: tr.p ?? fixed([0, 0]),
        a: tr.a ?? fixed([0, 0]),
        s: tr.s ?? fixed([100, 100]),
        r: fixed(0),
        o: tr.o ?? fixed(100),
      },
    ],
  };
}

// A group that scales up from `from`% and fades in around (cx, cy).
function pop(items, cx, cy, start, end, from = 70) {
  return group(items, {
    a: fixed([cx, cy]),
    p: fixed([cx, cy]),
    s: anim([
      [start, [from, from]],
      [end, [100, 100]],
    ]),
    o: anim([
      [start, 0],
      [end, 100],
    ]),
  });
}

// --- layers ----------------------------------------------------------------

// Fades in and rises 6px, the same as .ds-reveal.
function enter(start, end, shift = 6) {
  return {
    o: anim([
      [start, 0],
      [end, 100],
    ]),
    p: anim([
      [start, [0, shift]],
      [end, [0, 0]],
    ]),
  };
}

function layer(role, shapes, ks = {}) {
  return { role, shapes, ks };
}

function animation(name, w, h, op, layers) {
  const built = layers.map((l, n) => {
    // Colour each fill and stroke with the layer's fallback colour.
    const color = COLORS[l.role];
    const paint = (items) =>
      items.map((s) => {
        if (s.ty === "gr") return { ...s, it: paint(s.it) };
        if (s.ty === "st" || s.ty === "fl") return { ...s, c: fixed(color) };
        return s;
      });
    return {
      ddd: 0,
      ind: n + 1,
      ty: 4,
      nm: `${l.role} ${n + 1}`,
      cl: `c-${l.role}`,
      sr: 1,
      ks: {
        o: l.ks.o ?? fixed(100),
        r: fixed(0),
        p: l.ks.p ?? fixed([0, 0]),
        a: fixed([0, 0]),
        s: fixed([100, 100]),
      },
      ao: 0,
      shapes: paint(l.shapes),
      ip: 0,
      op,
      st: 0,
      bm: 0,
    };
  });
  // Lottie draws the first layer on top; the lists below read bottom to top.
  return { v: "5.7.4", fr: FR, ip: 0, op, w, h, nm: name, ddd: 0, assets: [], layers: built.reverse() };
}

// --- custom animations -----------------------------------------------------

// Step 1 · Annota la fonte: a web page, one line gets highlighted and pinned to a source tag.
function fonte() {
  const page = enter(0, 16);
  const tag = {
    o: anim([
      [50, 0],
      [66, 100],
    ]),
    p: anim([
      [50, [-4, 0]],
      [66, [0, 0]],
    ]),
  };
  return animation("fonte", 160, 112, 96, [
    layer("paper", [group([rect(64, 56, 104, 84, 8), fill()])], page),
    layer(
      "faint",
      [
        group([rect(64, 56, 104, 84, 8), stroke(1.5)]),
        group([
          line([
            [12, 28],
            [116, 28],
          ]),
          stroke(1.5),
        ]),
        group([circle(21, 21, 3.5), circle(28, 21, 3.5), circle(35, 21, 3.5), fill()]),
        group([
          line([
            [24, 42],
            [92, 42],
          ]),
          line([
            [24, 54],
            [80, 54],
          ]),
          line([
            [24, 66],
            [100, 66],
          ]),
          line([
            [24, 78],
            [70, 78],
          ]),
          stroke(4),
        ]),
      ],
      page,
    ),
    layer(
      "accent-soft",
      [
        group([rect(62, 66, 88, 14, 4), fill()], {
          a: fixed([18, 66]),
          p: fixed([18, 66]),
          s: anim([
            [18, [0, 100]],
            [40, [100, 100]],
          ]),
        }),
      ],
      page,
    ),
    layer(
      "accent",
      [
        group([
          line([
            [24, 66],
            [100, 66],
          ]),
          stroke(4),
          draw(22, 44),
        ]),
        group([
          curve(
            [
              [106, 66],
              [118, 54],
            ],
            [
              [0, 0],
              [0, 8],
            ],
            [
              [8, 0],
              [0, 0],
            ],
          ),
          stroke(1.5),
          draw(40, 54),
        ]),
      ],
      page,
    ),
    layer("paper", [group([rect(135, 43, 34, 24, 5), fill()])], tag),
    layer(
      "accent",
      [
        group([rect(135, 43, 34, 24, 5), stroke(1.5)]),
        group([
          line([
            [126, 39],
            [144, 39],
          ]),
          stroke(3),
        ]),
      ],
      tag,
    ),
    layer(
      "faint",
      [
        group([
          line([
            [126, 47],
            [137, 47],
          ]),
          stroke(3),
        ]),
      ],
      tag,
    ),
  ]);
}

// Step 2 · Verifica il segnale: before and after, the old value is struck, a green check confirms.
function verifica() {
  const cells = enter(0, 14);
  return animation("verifica", 160, 112, 90, [
    layer("subtle", [group([rect(40, 60, 56, 44, 6), fill()])], cells),
    layer("accent-soft", [group([rect(120, 60, 56, 44, 6), fill()])], cells),
    layer(
      "faint",
      [
        group([rect(40, 60, 56, 44, 6), stroke(1.5)]),
        group([
          line([
            [24, 47],
            [36, 47],
          ]),
          line([
            [104, 47],
            [116, 47],
          ]),
          stroke(2.5),
        ]),
        group([
          line([
            [24, 64],
            [50, 64],
          ]),
          stroke(5),
        ]),
      ],
      cells,
    ),
    layer(
      "ink",
      [
        group([
          line([
            [21, 64],
            [53, 64],
          ]),
          stroke(1.5),
          draw(16, 30),
        ]),
        group([
          line([
            [73, 60],
            [87, 60],
          ]),
          line([
            [83, 56],
            [87, 60],
            [83, 64],
          ]),
          stroke(1.5),
          draw(8, 22),
        ]),
      ],
      cells,
    ),
    layer(
      "accent",
      [
        group([
          line([
            [104, 64],
            [130, 64],
          ]),
          stroke(5),
          draw(26, 42),
        ]),
      ],
      cells,
    ),
    layer("ok", [pop([circle(146, 40, 20), fill()], 146, 40, 44, 58)]),
    layer("on-ok", [
      group([
        line([
          [141.5, 40.2],
          [144.6, 43.2],
          [150.4, 37.2],
        ]),
        stroke(2),
        draw(52, 66),
      ]),
    ]),
  ]);
}

// Step 3 · Componi il briefing: a document writes itself, every line ends on its source.
function briefing() {
  const doc = enter(0, 14);
  const dots = [
    [108, 44, 30],
    [102, 58, 40],
    [106, 72, 50],
  ];
  return animation("briefing", 160, 112, 84, [
    layer("paper", [group([rect(80, 56, 80, 96, 6), fill()])], doc),
    layer(
      "faint",
      [
        group([rect(80, 56, 80, 96, 6), stroke(1.5)]),
        group([
          line([
            [54, 44],
            [100, 44],
          ]),
          stroke(3.5),
          draw(16, 30),
        ]),
        group([
          line([
            [54, 58],
            [94, 58],
          ]),
          stroke(3.5),
          draw(26, 40),
        ]),
        group([
          line([
            [54, 72],
            [98, 72],
          ]),
          stroke(3.5),
          draw(36, 50),
        ]),
        group([
          line([
            [54, 88],
            [78, 88],
          ]),
          stroke(3.5),
          draw(46, 58),
        ]),
      ],
      doc,
    ),
    layer(
      "ink",
      [
        group([
          line([
            [54, 26],
            [94, 26],
          ]),
          stroke(5),
          draw(6, 20),
        ]),
      ],
      doc,
    ),
    layer(
      "accent",
      dots.map(([x, y, t]) => pop([circle(x, y, 6), fill()], x, y, t, t + 10, 0)),
    ),
  ]);
}

// Richiesta ricevuta: an envelope, then a green check on its corner.
function richiesta() {
  const env = enter(0, 16);
  return animation("richiesta", 96, 96, 80, [
    layer("paper", [group([rect(44, 54, 56, 40, 6), fill()])], env),
    layer(
      "ink",
      [
        group([rect(44, 54, 56, 40, 6), stroke(2)]),
        group([
          line([
            [18, 38],
            [44, 56],
            [70, 38],
          ]),
          stroke(2),
          draw(10, 28),
        ]),
      ],
      env,
    ),
    layer("ok", [pop([circle(70, 32, 24), fill()], 70, 32, 30, 46)]),
    layer("on-ok", [
      group([
        line([
          [64.6, 32.2],
          [68.4, 36],
          [75.4, 28.8],
        ]),
        stroke(2.2),
        draw(40, 56),
      ]),
    ]),
  ]);
}

// --- logo ------------------------------------------------------------------

// The animated logo: the "c." symbol and the wordmark "competia.work", drawn at the
// exact size and place of the static logo in the header (components/Logo.tsx), so
// the two can swap without anything moving. The wordmark outlines come from
// wordmark.json (see outline-wordmark.mjs). Everything is drawn 4× larger than the
// CSS size; the player scales it back down.
const K = 4;
const LOGO_W = 150;
const LOGO_H = 27.25;
const TILE = { x: 0, y: 2.59375, size: 22 };

const r2 = (n) => Math.round(n * 100) / 100;
const px = ([x, y]) => [r2(x * K), r2(y * K)];
// A point of the 64-unit symbol (public/favicon.svg) inside the logo box, and a
// tangent (a point relative to another), which only scales.
const tile = ([x, y]) => px([TILE.x + (x * TILE.size) / 64, TILE.y + (y * TILE.size) / 64]);
const tileTangent = ([x, y]) => px([(x * TILE.size) / 64, (y * TILE.size) / 64]);

// A circular arc as cubic curves, from angle a0 to a1 (radians, y pointing down).
function arc(cx, cy, r, a0, a1, parts = 3) {
  const step = (a1 - a0) / parts;
  const k = (4 / 3) * Math.tan(step / 4);
  const at = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const v = [];
  const i = [];
  const o = [];
  for (let n = 0; n <= parts; n++) {
    const a = a0 + step * n;
    const [x, y] = at(a);
    const t = [-r * k * Math.sin(a), r * k * Math.cos(a)];
    v.push([x, y]);
    i.push(n === 0 ? [0, 0] : [-t[0], -t[1]]);
    o.push(n === parts ? [0, 0] : t);
  }
  return { v, i, o };
}

// A path from its vertices and tangents; `point` and `tangent` place them in the box.
const outline = ({ v, i, o }, closed, point, tangent) => ({
  ty: "sh",
  ks: fixed({ v: v.map(point), i: i.map(tangent), o: o.map(tangent), c: closed }),
});

// Drops from `height` px above, passes its place by a hair and settles.
function settle(start, height) {
  return {
    o: anim([
      [start, 0],
      [start + 5, 100],
    ]),
    p: anim([
      [start, [0, -height * K]],
      [start + 12, [0, 0.6 * K]],
      [start + 20, [0, 0]],
    ]),
  };
}

function logo() {
  const wordmark = JSON.parse(fs.readFileSync(path.join(here, "wordmark.json"), "utf8"));
  const glyph = (g, tr) =>
    group(
      [...g.contours.map((c) => outline(c, true, px, px)), fill()],
      tr,
    );
  // Each letter fades in and rises 3px; letters follow each other by 2.5 frames.
  const letter = (g, start) =>
    glyph(g, {
      o: anim([
        [start, 0],
        [start + 14, 100],
      ]),
      p: anim([
        [start, [0, 3 * K]],
        [start + 14, [0, 0]],
      ]),
    });
  const dotAt = wordmark.text.indexOf(".");
  const before = wordmark.glyphs.slice(0, dotAt);
  const after = wordmark.glyphs.slice(dotAt + 1);
  const DOTS = 36;

  // The "c": an arc of radius 14 around the symbol's centre, drawn from its top end.
  const end = Math.atan2(-9, 6.72);
  const c = arc(32, 32, 14, end, end - (2 * Math.PI - 2 * Math.abs(end)));
  const center = tile([32, 32]);

  return animation("logo", LOGO_W * K, LOGO_H * K, 72, [
    layer("logo-tile", [
      pop(
        [
          {
            ty: "rc",
            d: 1,
            p: fixed(center),
            s: fixed([TILE.size * K, TILE.size * K]),
            r: fixed(((14 * TILE.size) / 64) * K),
          },
          fill(),
        ],
        center[0],
        center[1],
        0,
        14,
        80,
      ),
    ]),
    layer("logo-glyph", [
      group([outline(c, false, tile, tileTangent), stroke((6 * TILE.size * K) / 64), draw(6, 28)]),
    ]),
    layer("logo-dot", [group([circle(...tile([47, 43]), ((9 * TILE.size) / 64) * K), fill()])], settle(DOTS, 5)),
    layer(
      "text",
      before.map((g, n) => letter(g, 8 + 2.5 * n)),
    ),
    layer("accent", [glyph(wordmark.glyphs[dotAt])], settle(DOTS, 6)),
    layer(
      "text",
      after.map((g, n) => letter(g, 46 + 2.5 * n)),
    ),
  ]);
}

const custom = { fonte, verifica, briefing, richiesta, logo };
for (const [name, make] of Object.entries(custom)) {
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(make()));
}

// --- adapted useAnimations files -------------------------------------------

// file → [output name, colour role]
const adapted = {
  mail: ["email", "accent"],
  explore: ["bussola", "ink"],
  searchToX: ["nessun-risultato", "ink"],
  alertTriangle: ["avviso", "ink"],
};

for (const [file, [name, role]] of Object.entries(adapted)) {
  const a = JSON.parse(fs.readFileSync(path.join(here, "useanimations", `${file}.json`), "utf8"));
  const thin = (items) =>
    items.map((s) => {
      if (s.ty === "gr") return { ...s, it: thin(s.it) };
      if (s.ty === "st") return { ...s, w: fixed(1.5), c: fixed(COLORS[role]) };
      if (s.ty === "fl") return { ...s, c: fixed(COLORS[role]) };
      return s;
    });
  a.nm = name;
  a.layers = a.layers.map((l) => ({ ...l, cl: `c-${role}`, shapes: thin(l.shapes ?? []) }));
  fs.writeFileSync(path.join(out, `${name}.json`), JSON.stringify(a));
}

console.log(
  `Written to ${path.relative(process.cwd(), out)}:`,
  [...Object.keys(custom), ...Object.values(adapted).map(([n]) => n)].join(", "),
);
