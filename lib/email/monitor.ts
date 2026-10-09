// The site check behind the "sito non risponde" alert: a few public pages must answer 200.
import type { Problema } from "./templates";

export const CHECKED_PATHS = ["/", "/prodotto", "/richiedi-accesso", "/accedi", "/legale/privacy", "/lottie/logo.json"];

export async function checkSite(site: string, timeoutMs = 10_000) {
  const urls = [...CHECKED_PATHS.map((p) => `${site}${p}`), site.replace("://www.", "://")];
  const results = await Promise.all(
    urls.map(async (url): Promise<Problema & { ok: boolean }> => {
      const start = Date.now();
      try {
        const res = await fetch(url, {
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(timeoutMs),
          headers: { "User-Agent": "competia-controllo-sito" },
        });
        return { url, stato: res.status, ms: Date.now() - start, ok: res.status === 200 };
      } catch (e) {
        const errore = e instanceof Error ? (e.name === "TimeoutError" ? `oltre ${timeoutMs / 1000} s` : e.message) : "errore";
        return { url, stato: null, errore, ms: Date.now() - start, ok: false };
      }
    }),
  );
  return { controllati: results.length, problemi: results.filter((r) => !r.ok).map(({ ok: _ok, ...r }) => r) };
}
