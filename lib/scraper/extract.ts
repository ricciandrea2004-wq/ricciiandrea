// Turns an HTML page into plain text lines, so two visits can be compared line by line.
import { createHash } from "node:crypto";
import { parse } from "node-html-parser";
import { ScrapeError } from "./net";

const DROP = "script, style, noscript, template, svg, canvas, iframe, head";

export function htmlToText(html: string, selector?: string | null) {
  const root = parse(html, { comment: false });
  root.querySelectorAll(DROP).forEach((el) => el.remove());
  if (selector) {
    let scoped: ReturnType<typeof root.querySelector> = null;
    try {
      scoped = root.querySelector(selector);
    } catch {
      throw new ScrapeError("selector", `Il selettore "${selector}" non è valido.`);
    }
    // A missing selector is an error, not a fallback: comparing a different part of the page
    // would produce a false change.
    if (!scoped) throw new ScrapeError("selector", `Il selettore "${selector}" non trova niente nella pagina.`);
    return normalizeText(scoped.structuredText);
  }
  const scope = root.querySelector("main") || root.querySelector("body") || root;
  return normalizeText(scope.structuredText);
}

export function normalizeText(text: string) {
  return text
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function pageTitle(html: string) {
  return parse(html).querySelector("title")?.text.trim() || null;
}

export function sha256(text: string) {
  return createHash("sha256").update(text).digest("hex");
}
