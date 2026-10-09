// Line comparison between two snapshots. Lines are compared as a multiset: a line that only moved
// does not count as a change, which keeps reordered lists and carousels from raising signals.
export type TextDiff = { added: string[]; removed: string[] };

export function diffLines(before: string, after: string): TextDiff {
  const count = new Map<string, number>();
  for (const line of before.split("\n")) if (line) count.set(line, (count.get(line) ?? 0) + 1);
  const added: string[] = [];
  for (const line of after.split("\n")) {
    if (!line) continue;
    const n = count.get(line) ?? 0;
    if (n > 0) count.set(line, n - 1);
    else added.push(line);
  }
  const removed: string[] = [];
  for (const line of before.split("\n")) {
    const n = count.get(line) ?? 0;
    if (line && n > 0) {
      removed.push(line);
      count.set(line, n - 1);
    }
  }
  return { added, removed };
}

export function hasChanges(diff: TextDiff) {
  return diff.added.length > 0 || diff.removed.length > 0;
}

// First price in a list of lines, in the forms "48 €", "€ 48,00", "48 euro", "EUR 48".
const PRICE_RE = /(?:€|\beur\b)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|(?:euro|eur)\b)/i;

export function firstPrice(lines: string[]) {
  for (const line of lines) {
    const m = line.match(PRICE_RE);
    if (m) return m[0].replace(/\s+/g, " ").trim();
  }
  return null;
}

export function excerpt(lines: string[], maxLines = 3, maxChars = 280) {
  if (lines.length === 0) return "";
  let text = lines.slice(0, maxLines).join(" · ");
  if (text.length > maxChars) text = `${text.slice(0, maxChars - 1).trimEnd()}…`;
  const more = lines.length - maxLines;
  return more > 0 ? `${text} (+${more} righe)` : text;
}
