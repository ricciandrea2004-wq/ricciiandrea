// Italian-formatted numbers inside a label, e.g. "52 € / mese" or "1.299,90 €".
const NUMBER = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

type Part = { raw: string; value: number; decimals: number; grouped: boolean };

function parts(label: string): { template: string; numbers: Part[] } {
  const numbers: Part[] = [];
  const template = label.replace(NUMBER, (raw) => {
    numbers.push({
      raw,
      value: Number(raw.replace(/\./g, "").replace(",", ".")),
      decimals: raw.split(",")[1]?.length ?? 0,
      grouped: raw.includes("."),
    });
    return "\u0000";
  });
  return { template, numbers };
}

export function formatLike(value: number, like: Part) {
  const [int, dec] = value.toFixed(like.decimals).split(".");
  const grouped = like.grouped ? int!.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : int!;
  return dec ? `${grouped},${dec}` : grouped;
}

// When two labels differ in exactly one number ("52 € / mese" → "48 € / mese"), returns
// that number's two values and a way to write any value in between into the "after"
// label. Otherwise null: the change is shown without counting.
export function countableChange(before: string, after: string) {
  const a = parts(before);
  const b = parts(after);
  if (a.template !== b.template || a.numbers.length !== b.numbers.length) return null;
  const changed = b.numbers.flatMap((n, i) => (n.value !== a.numbers[i]!.value ? [i] : []));
  if (changed.length !== 1) return null;
  const at = changed[0]!;
  const target = b.numbers[at]!;
  return {
    from: a.numbers[at]!.value,
    to: target.value,
    write(value: number) {
      let n = -1;
      return after.replace(NUMBER, (raw) => (++n === at ? formatLike(value, target) : raw));
    },
  };
}
