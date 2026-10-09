// Outbound requests for the scraper. Only public http(s) addresses on the default ports are
// fetched: a source URL comes from a user, so it must never reach localhost or a private network.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const USER_AGENT = "CompetiaBot/0.1 (+https://www.competia.work/contatti)";
export const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

export class ScrapeError extends Error {
  constructor(
    public code: | "invalid_url"
      | "private_address"
      | "dns"
      | "timeout"
      | "http"
      | "too_large"
      | "unsupported"
      | "empty"
      | "selector"
      | "network",
    message: string,
  ) {
    super(message);
  }
}

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string) {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v);
}

export function isPrivateAddress(ip: string) {
  return isIP(ip) === 6 ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

// Shape check without DNS, used when a source is added: scheme, no credentials, default port,
// and a host that is not obviously local or a private IP literal.
export function assertUrlShape(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScrapeError("invalid_url", "Sono ammessi solo indirizzi http e https.");
  }
  if (url.username || url.password) {
    throw new ScrapeError("invalid_url", "L'indirizzo non può contenere credenziali.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new ScrapeError("invalid_url", "Sono ammesse solo le porte 80 e 443.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host.includes(".") || /\.(localhost|local|internal|lan|home)$/.test(host)) {
    throw new ScrapeError("private_address", "L'indirizzo non è pubblico.");
  }
  if (isIP(host) && isPrivateAddress(host)) {
    throw new ScrapeError("private_address", "L'indirizzo non è pubblico.");
  }
  return host;
}

// Before every request: the shape check, then every address the host resolves to must be public.
export async function assertPublicUrl(url: URL) {
  const host = assertUrlShape(url);
  let addresses: string[];
  if (isIP(host)) {
    addresses = [host];
  } else {
    try {
      addresses = (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);
    } catch {
      throw new ScrapeError("dns", `Il dominio ${host} non risponde.`);
    }
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new ScrapeError("private_address", "L'indirizzo non è pubblico.");
  }
}

export type FetchedPage = { url: string; status: number; contentType: string; body: string };

export type FetchOptions = {
  // Tests replace the address check to run against a local server. Production never sets it.
  checkUrl?: (url: URL) => Promise<void>;
  accept?: string;
};

// GET with a timeout, a size cap and manual redirects, so each hop is checked again.
export async function fetchText(input: string, options: FetchOptions = {}): Promise<FetchedPage> {
  const checkUrl = options.checkUrl ?? assertPublicUrl;
  let url = new URL(input);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await checkUrl(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: options.accept ?? "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
          "Accept-Language": "it-IT,it;q=0.9,en;q=0.5",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (err) {
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw new ScrapeError("timeout", "La pagina non ha risposto in tempo.");
      }
      throw new ScrapeError("network", "Connessione alla pagina non riuscita.");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location")!, url);
      await res.body?.cancel();
      continue;
    }
    const contentType = res.headers.get("content-type") ?? "";
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) {
      await res.body?.cancel();
      throw new ScrapeError("too_large", "La pagina è troppo grande.");
    }
    const body = await readCapped(res);
    return { url: url.toString(), status: res.status, contentType, body };
  }
  throw new ScrapeError("http", "Troppi reindirizzamenti.");
}

async function readCapped(res: Response) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new ScrapeError("too_large", "La pagina è troppo grande.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}
