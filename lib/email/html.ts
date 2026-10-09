// The email layout and its building blocks, drawn with the site's design tokens (lib/email/tokens.ts,
// generated from app/tokens.css): Inter with Notion's fallback chain, warm neutrals, one blue accent,
// Notion tag colours with the same meaning as in the workspace.
//
// Email clients are not browsers: layout is tables, styles are inline, colours are solid hex, and
// there is no JavaScript or CSS animation. Motion comes from GIFs rendered from the site's Lottie
// files (scripts/email/build-assets.mjs). A <style> block adds what capable clients understand:
// the dark theme (Apple Mail, iOS Mail) and the still images for reduced motion.
import { tokens } from "./tokens";
import type { Category, SignalStatus, TagColor } from "../domain";
import { categoryColor, categoryLabel, statusColor, statusLabel } from "../domain";

const L = tokens.light;
const D = tokens.dark;
const F = tokens.font;
const S = tokens.size;

export const SITE_URL = "https://www.competia.work";

export function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Where the email images live. Previews pass a local folder; real emails use the site. */
export type RenderOptions = { assetBase?: string; siteUrl?: string };

export type Ctx = { assets: string; site: string };

export function context(opts: RenderOptions = {}): Ctx {
  const site = (opts.siteUrl ?? process.env.SITE_URL ?? SITE_URL).replace(/\/$/, "");
  return { site, assets: (opts.assetBase ?? `${site}/email`).replace(/\/$/, "") };
}

// ——— Text styles ———————————————————————————————————————————————————————————————

const base = `font-family:${F.sans};font-feature-settings:${F.features};-webkit-font-smoothing:antialiased;`;
const textStyle = (size: number, color: string, extra = "") =>
  `${base}font-size:${size}px;line-height:${Math.round(size * tokens.leading.body)}px;color:${color};margin:0;${extra}`;

export function h1(text: string) {
  return `<h1 class="em-text" style="${base}font-size:${S.h3}px;line-height:${Math.round(S.h3 * 1.25)}px;font-weight:700;letter-spacing:${tokens.tracking.title};color:${L.text};margin:0 0 ${tokens.space[3]}px;">${esc(text)}</h1>`;
}

export function h2(text: string) {
  return `<h2 class="em-text" style="${base}font-size:${S.lg}px;line-height:${Math.round(S.lg * 1.4)}px;font-weight:600;letter-spacing:${tokens.tracking.heading};color:${L.text};margin:${tokens.space[6]}px 0 ${tokens.space[2]}px;">${esc(text)}</h2>`;
}

/** A paragraph. `html` is trusted markup built with esc(); plain strings go through p(). */
export function pHtml(html: string, tone: "text" | "secondary" | "tertiary" = "text", size: number = S.base) {
  const color = tone === "text" ? L.text : tone === "secondary" ? L.textSecondary : L.textTertiary;
  const cls = tone === "text" ? "em-text" : tone === "secondary" ? "em-text2" : "em-text3";
  return `<p class="${cls}" style="${textStyle(size, color, `margin:0 0 ${tokens.space[4]}px;`)}">${html}</p>`;
}

export function p(text: string, tone: "text" | "secondary" | "tertiary" = "text", size: number = S.base) {
  return pHtml(esc(text), tone, size);
}

export function strong(text: string) {
  return `<strong style="font-weight:600;">${esc(text)}</strong>`;
}

export function link(href: string, label: string) {
  return `<a class="em-link" href="${esc(href)}" style="color:${L.accentText};text-decoration:underline;text-underline-offset:2px;">${esc(label)}</a>`;
}

// ——— Blocks ————————————————————————————————————————————————————————————————————

/** The primary button of the site (.btn-primary): accent fill, 6 px radius. */
export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${tokens.space[2]}px 0 ${tokens.space[5]}px;"><tr>
<td class="em-btn" bgcolor="${L.accent}" style="background-color:${L.accent};border-radius:${tokens.radius.sm}px;">
<a href="${esc(href)}" class="em-btn-a" style="${base}display:inline-block;padding:11px 18px;font-size:15px;line-height:20px;font-weight:600;color:${L.onAccent};text-decoration:none;border-radius:${tokens.radius.sm}px;">${esc(label)}</a>
</td></tr></table>`;
}

/** Under each button: the same link in plain text, for clients that block buttons. */
export function fallbackLink(href: string) {
  return pHtml(
    `Se il bottone non funziona, copia questo indirizzo nel browser:<br><a class="em-text3" href="${esc(href)}" style="color:${L.textTertiary};word-break:break-all;">${esc(href)}</a>`,
    "tertiary",
    S.xs,
  );
}

/** Notion-style callout: subtle background, 6 px radius. */
export function callout(html: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 ${tokens.space[5]}px;"><tr>
<td class="em-subtle" bgcolor="${L.bgSubtle}" style="background-color:${L.bgSubtle};border-radius:${tokens.radius.sm}px;padding:${tokens.space[4]}px ${tokens.space[4]}px 0;">${html}</td>
</tr></table>`;
}

/** A one-time code, in the mono stack, large and spaced like the site's code inputs. */
export function code(value: string) {
  return `<p class="em-text" style="font-family:${F.mono};font-size:28px;line-height:36px;letter-spacing:6px;font-weight:600;color:${L.text};margin:0 0 ${tokens.space[4]}px;">${esc(value)}</p>`;
}

export function divider() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="em-border" style="border-top:1px solid ${L.border};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr></table>`;
}

export function spacer(px: number) {
  return `<div style="height:${px}px;line-height:${px}px;font-size:0;">&nbsp;</div>`;
}

/** A tag in the workspace's colours (.tag): coloured text on its pale background. */
export function tag(label: string, color: TagColor, opts: { pulse?: Ctx } = {}) {
  const key = color[0].toUpperCase() + color.slice(1);
  const fg = L[`tag${key}` as keyof typeof L];
  const bg = L[`tag${key}Bg` as keyof typeof L];
  // The "Da verificare" tag breathes in the workspace (StatusTag live); here a looping GIF dot.
  const pulse = opts.pulse
    ? `${animated(opts.pulse, "punto-da-verificare", 6, 6, "", "display:inline-block;vertical-align:middle;margin:0 5px 1px 0;")}`
    : "";
  return `<span class="em-tag-${color}" style="${base}display:inline-block;font-size:${S.xs}px;line-height:18px;font-weight:500;color:${fg};background-color:${bg};border-radius:${tokens.radius.xs}px;padding:0 6px;white-space:nowrap;">${pulse}${esc(label)}</span>`;
}

export function categoryTag(c: Category) {
  return tag(categoryLabel[c], categoryColor[c]);
}

export function statusTag(s: SignalStatus, ctx?: Ctx) {
  return tag(statusLabel[s], statusColor[s], s === "to_verify" && ctx ? { pulse: ctx } : {});
}

/** A big number with a label, as in the Panoramica of the workspace. */
export function stats(items: { value: number; label: string }[]) {
  const cells = items
    .map(
      (i) => `<td valign="top" style="padding:0 ${tokens.space[4]}px ${tokens.space[2]}px 0;">
<p class="em-text" style="${base}font-size:${S.h3}px;line-height:30px;font-weight:700;letter-spacing:${tokens.tracking.title};color:${L.text};margin:0;">${esc(i.value)}</p>
<p class="em-text2" style="${textStyle(S.sm, L.textSecondary)}">${esc(i.label)}</p></td>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 ${tokens.space[4]}px;"><tr>${cells}</tr></table>`;
}

export type SignalRow = {
  competitor: string;
  category: Category;
  title: string;
  before?: string;
  after?: string;
  status?: SignalStatus;
  meta?: string;
  url: string;
};

/** A signal as in the workspace list: competitor, category, title, before → after, status. */
export function signalRow(s: SignalRow, ctx: Ctx) {
  const change =
    s.before && s.after
      ? `<p class="em-text2" style="${textStyle(S.sm, L.textSecondary, "margin:4px 0 0;")}"><span class="em-text3" style="color:${L.textTertiary};text-decoration:line-through;">${esc(s.before)}</span>&nbsp;&nbsp;→&nbsp;&nbsp;<strong class="em-text" style="color:${L.text};font-weight:600;">${esc(s.after)}</strong></p>`
      : "";
  const meta = s.meta ? `<p class="em-text3" style="${textStyle(S.xs, L.textTertiary, "margin:4px 0 0;")}">${esc(s.meta)}</p>` : "";
  return `<tr><td class="em-border" style="border-top:1px solid ${L.border};padding:${tokens.space[3]}px 0;">
<p class="em-text2" style="${textStyle(S.xs, L.textSecondary, "margin:0 0 4px;")}">${esc(s.competitor)}&nbsp;&nbsp;${categoryTag(s.category)}${s.status ? `&nbsp;${statusTag(s.status, ctx)}` : ""}</p>
<p style="${textStyle(15, L.text)}"><a class="em-text" href="${esc(s.url)}" style="color:${L.text};font-weight:600;text-decoration:none;">${esc(s.title)}</a></p>
${change}${meta}
</td></tr>`;
}

export function signalList(rows: SignalRow[], ctx: Ctx) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 ${tokens.space[5]}px;">${rows
    .map((r) => signalRow(r, ctx))
    .join("")}<tr><td class="em-border" style="border-top:1px solid ${L.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

// ——— Images ————————————————————————————————————————————————————————————————————

/**
 * One drawing in four files: animated GIF and still PNG, light and dark.
 * - Default: the light GIF. It plays once and stops on the finished drawing.
 * - Outlook on Windows (mso) gets the light PNG only: it would show just the first GIF frame.
 * - Dark theme (Apple Mail, iOS Mail): the dark GIF. Reduced motion: the PNG of the same theme.
 * Clients without <style> support keep the light GIF.
 */
export function animated(ctx: Ctx, name: string, width: number, height: number, alt: string, style = "display:block;") {
  const img = (file: string, cls: string, hidden: boolean) =>
    `<img class="${cls}" src="${ctx.assets}/${file}" width="${width}" height="${height}" alt="${esc(alt)}" border="0" style="${style}width:${width}px;height:${height}px;border:0;outline:none;${hidden ? "display:none;mso-hide:all;" : ""}">`;
  return `<!--[if mso]>${img(`${name}.png`, "", false)}<![endif]--><!--[if !mso]><!-->${img(`${name}.gif`, "em-lg", false)}${img(`${name}.png`, "em-lp", true)}${img(`${name}-scuro.gif`, "em-dg", true)}${img(`${name}-scuro.png`, "em-dp", true)}<!--<![endif]-->`;
}

/** The drawing at the top of an email, as on the site's confirmation pages. */
export function hero(ctx: Ctx, name: "richiesta" | "verifica" | "email" | "fonte" | "briefing" | "avviso", alt = "") {
  const size = { richiesta: [64, 64], email: [56, 56], avviso: [56, 56], verifica: [120, 84], fonte: [120, 84], briefing: [120, 84] }[name];
  return `<div style="margin:0 0 ${tokens.space[5]}px;">${animated(ctx, name, size[0], size[1], alt)}</div>`;
}

// ——— Layout ————————————————————————————————————————————————————————————————————

// Dark theme for clients that support prefers-color-scheme, from the same tokens as the site.
function darkCss() {
  const tags = (["gray", "blue", "purple", "orange", "yellow", "green", "red"] as const)
    .map((c) => {
      const k = c[0].toUpperCase() + c.slice(1);
      return `.em-tag-${c}{color:${D[`tag${k}` as keyof typeof D]}!important;background-color:${D[`tag${k}Bg` as keyof typeof D]}!important}`;
    })
    .join("");
  return `
.em-bg{background-color:${D.bg}!important}
.em-text{color:${D.text}!important}
.em-text2{color:${D.textSecondary}!important}
.em-text3{color:${D.textTertiary}!important}
.em-link{color:${D.accentText}!important}
.em-border{border-color:${D.border}!important}
.em-subtle{background-color:${D.bgSubtle}!important}
.em-btn{background-color:${D.accent}!important}
${tags}
.em-lg{display:none!important}
.em-dg{display:block!important}
span .em-dg{display:inline-block!important}`;
}

const styleBlock = `<style>
body{margin:0;padding:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
a{text-decoration-thickness:1px}
@media (max-width:600px){.em-pad{padding-left:20px!important;padding-right:20px!important}}
@media (prefers-color-scheme:dark){${darkCss()}}
@media (prefers-reduced-motion:reduce){.em-lg,.em-dg,span .em-lg,span .em-dg{display:none!important}.em-lp{display:block!important}span .em-lp{display:inline-block!important}}
@media (prefers-reduced-motion:reduce) and (prefers-color-scheme:dark){.em-lp,span .em-lp{display:none!important}.em-dp{display:block!important}span .em-dp{display:inline-block!important}}
</style>`;

export type LayoutInput = {
  ctx: Ctx;
  title: string;
  preheader: string;
  body: string;
  /** Why this person gets this email, in the footer. */
  reason: string;
  /** Extra footer line, e.g. how to stop the weekly summary. */
  footerExtra?: string;
};

export function layout({ ctx, title, preheader, body, reason, footerExtra }: LayoutInput) {
  // Invisible text that inbox lists show next to the subject, padded so the body does not leak in.
  const pre = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${L.bg};opacity:0;">${esc(preheader)}${"&#8199;&#65279;&#847; ".repeat(40)}</div>`;
  const footer = `${divider()}${spacer(tokens.space[4])}
<p class="em-text2" style="${textStyle(S.xs, L.textSecondary, "margin:0 0 6px;")}"><strong style="font-weight:600;">competia.work</strong> · Sai cosa cambia sul mercato, con la fonte in mano.</p>
<p class="em-text3" style="${textStyle(S.xs, L.textTertiary, "margin:0 0 6px;")}">${esc(reason)}${footerExtra ? ` ${footerExtra}` : ""}</p>
<p class="em-text3" style="${textStyle(S.xs, L.textTertiary)}">${link(`${ctx.site}/legale/privacy`, "Privacy")} · ${link(`${ctx.site}/contatti`, "Contatti")} · ${link("mailto:ciao@competia.work", "ciao@competia.work")}</p>`;

  return `<!doctype html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><!--<![endif]-->
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>table,td,p,a,h1,h2{font-family:Segoe UI,Arial,sans-serif!important}</style><![endif]-->
${styleBlock}
</head>
<body class="em-bg" style="margin:0;padding:0;background-color:${L.bg};">
${pre}
<table role="presentation" class="em-bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${L.bg}" style="background-color:${L.bg};">
<tr><td align="center" style="padding:0;">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td class="em-pad" style="padding:${tokens.space[7]}px ${tokens.space[5]}px ${tokens.space[6]}px;text-align:left;">
<a href="${ctx.site}" style="display:inline-block;text-decoration:none;">${animated(ctx, "logo", 150, 27, "competia.work")}</a>
${spacer(tokens.space[7])}
${body}
${spacer(tokens.space[4])}
${footer}
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;
}

// ——— Plain text ————————————————————————————————————————————————————————————————

/** The plain-text version: same words, links written out, the same footer. */
export function textLayout(lines: (string | false | null | undefined)[], reason: string, site: string) {
  const body = lines.filter((l) => l !== false && l != null).join("\n");
  return `${body}\n\n—\ncompetia.work · Sai cosa cambia sul mercato, con la fonte in mano.\n${reason}\nPrivacy: ${site}/legale/privacy · Contatti: ciao@competia.work\n`;
}
