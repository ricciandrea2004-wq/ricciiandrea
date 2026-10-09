// robots.txt as in RFC 9309: the group for "competiabot" wins over "*", the longest matching rule
// decides, and on a tie Allow wins. A 4xx means no rules; an unreachable file means do not crawl.
import { fetchText, ScrapeError, type FetchOptions } from "./net";

export const ROBOTS_AGENT = "competiabot";

type Rule = { allow: boolean; pattern: string; regex: RegExp };

export type Robots = {
  isAllowed(pathAndQuery: string): boolean;
  crawlDelaySeconds: number | null;
  // Set when robots.txt could not be read: nothing on the site is fetched, and the reason is shown.
  unavailable?: string;
};

const allowAll: Robots = { isAllowed: () => true, crawlDelaySeconds: null };
const unavailable = (reason: string): Robots => ({ isAllowed: () => false, crawlDelaySeconds: null, unavailable: reason });

function toRegex(pattern: string) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

export function parseRobots(text: string, agent = ROBOTS_AGENT): Robots {
  type Group = { agents: string[]; rules: Rule[]; crawlDelay: number | null };
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if ((key === "allow" || key === "disallow") && value) {
      current.rules.push({ allow: key === "allow", pattern: value, regex: toRegex(value) });
    } else if (key === "crawl-delay") {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) current.crawlDelay = n;
    }
  }

  const own = groups.filter((g) => g.agents.includes(agent));
  const chosen = own.length > 0 ? own : groups.filter((g) => g.agents.includes("*"));
  const rules = chosen.flatMap((g) => g.rules);
  const delays = chosen.map((g) => g.crawlDelay).filter((d): d is number => d !== null);

  return {
    crawlDelaySeconds: delays.length > 0 ? Math.max(...delays) : null,
    isAllowed(pathAndQuery: string) {
      if (pathAndQuery === "/robots.txt") return true;
      let best: Rule | null = null;
      for (const rule of rules) {
        if (!rule.regex.test(pathAndQuery)) continue;
        if (
          !best ||
          rule.pattern.length > best.pattern.length ||
          (rule.pattern.length === best.pattern.length && rule.allow)
        ) {
          best = rule;
        }
      }
      return best ? best.allow : true;
    },
  };
}

export async function loadRobots(origin: string, options: FetchOptions = {}): Promise<Robots> {
  try {
    const res = await fetchText(`${origin}/robots.txt`, { ...options, accept: "text/plain,*/*;q=0.1" });
    if (res.status >= 200 && res.status < 300) return parseRobots(res.body);
    if (res.status >= 400 && res.status < 500) return allowAll;
    return unavailable(`robots.txt non risponde (HTTP ${res.status}): il sito non si legge finché non torna disponibile.`);
  } catch (err) {
    return unavailable(err instanceof ScrapeError ? err.message : "robots.txt non raggiungibile.");
  }
}
