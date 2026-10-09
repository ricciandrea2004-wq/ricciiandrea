// Self-test for the scraper against a local server: robots.txt, per-host delay, baseline,
// unchanged, changed (with a signal), selector, PDF and the private-address block.
// Run with: npm run test:scraper
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { loadRobots, parseRobots } from "../../lib/scraper/robots";
import { diffLines } from "../../lib/scraper/diff";
import { assertPublicUrl, assertUrlShape } from "../../lib/scraper/net";
import { runScrape } from "../../lib/scraper/run";
import { memoryStore } from "../../lib/store/memory";

let price = "52 €";
const pages: Record<string, () => [number, string, string]> = {
  "/robots.txt": () => [200, "text/plain", "User-agent: *\nDisallow: /privato\nCrawl-delay: 0\n\nUser-agent: competiabot\nDisallow: /vietato\nAllow: /vietato/ok\n"],
  "/prezzi": () => [200, "text/html", `<html><head><title>Prezzi</title><script>var t=${Date.now()}</script></head><body><nav>Menu</nav><main><h1>Piani</h1><p>Pro: <b>${price}</b> al mese</p><p>Base: 19 €</p></main></body></html>`],
  "/vietato": () => [200, "text/html", "<main>no</main>"],
  "/privato": () => [200, "text/html", "<main>ok per noi</main>"],
  "/listino.pdf": () => [200, "application/pdf", "%PDF-1.4"],
  "/selettore": () => [200, "text/html", "<main><div id='a'>uno</div></main>"],
};
const hits: string[] = [];
const server = createServer((req, res) => {
  hits.push(`${Date.now()} ${req.url}`);
  const page = pages[req.url ?? ""];
  if (!page) return res.writeHead(404).end("not found");
  const [status, type, body] = page();
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8` }).end(body);
});

async function main() {
  // Unit checks.
  const robots = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: competiabot\nDisallow: /a\nAllow: /a/b$\n");
  assert.equal(robots.isAllowed("/x"), true, "own group replaces *");
  assert.equal(robots.isAllowed("/a/c"), false);
  assert.equal(robots.isAllowed("/a/b"), true, "longest rule wins");
  assert.equal(parseRobots("User-agent: *\nDisallow: /*.pdf$").isAllowed("/x/listino.pdf"), false);
  assert.deepEqual(diffLines("a\nb\nc", "c\na\nb"), { added: [], removed: [] }, "reorder is not a change");
  assert.deepEqual(diffLines("a\nb", "a\nB"), { added: ["B"], removed: ["b"] });
  assert.throws(() => assertUrlShape(new URL("http://127.0.0.1/")), /pubblico/);
  assert.throws(() => assertUrlShape(new URL("http://localhost:3000/")), /porte|pubblico/);
  assert.throws(() => assertUrlShape(new URL("file:///etc/passwd")), /http/);
  assert.throws(() => assertUrlShape(new URL("https://user:pw@example.com/")), /credenziali/);
  await assert.rejects(assertPublicUrl(new URL("http://10.0.0.1/")), /pubblico/);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;
  // The local server is private by definition: skip the address check only here.
  const fetchOptions = { checkUrl: async () => {} };
  const down = await loadRobots("http://127.0.0.1:1", fetchOptions);
  assert.ok(down.unavailable && !down.isAllowed("/"), "unreachable robots.txt means do not crawl, with a reason");

  const add = (path: string, category: "price" | "assortment", selector: string | null = null) =>
    memoryStore.addSource({ competitorId: "vela", url: `${base}${path}`, category, label: path, note: "", selector });
  const prezzi = await add("/prezzi", "price");
  const vietato = await add("/vietato", "assortment");
  const privato = await add("/privato", "assortment");
  const pdf = await add("/listino.pdf", "price");
  const sel = await add("/selettore", "assortment", "#manca");
  const ids = [prezzi.id, vietato.id, privato.id, pdf.id, sel.id];

  const run1 = await runScrape(memoryStore, { sourceIds: ids, minHostDelayMs: 200, fetchOptions });
  const outcome = (run: typeof run1, id: string) => run.results.find((r) => r.sourceId === id)?.outcome;
  assert.equal(outcome(run1, prezzi.id), "baseline");
  assert.equal(outcome(run1, vietato.id), "blocked", "competiabot group disallows /vietato");
  assert.equal(outcome(run1, privato.id), "baseline", "the * group does not apply to us");
  assert.equal(outcome(run1, pdf.id), "error");
  assert.equal(outcome(run1, sel.id), "error");
  assert.equal(hits.filter((h) => h.endsWith("/robots.txt")).length, 1, "robots.txt read once per host");
  assert.equal(hits.some((h) => h.endsWith("/vietato")), false, "blocked page never fetched");
  const times = hits.filter((h) => !h.endsWith("/robots.txt")).map((h) => Number(h.split(" ")[0]));
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 190, "per-host delay respected");

  const run2 = await runScrape(memoryStore, { sourceIds: [prezzi.id], minHostDelayMs: 0, fetchOptions });
  assert.equal(outcome(run2, prezzi.id), "unchanged", "script content is ignored");

  price = "48 €";
  const run3 = await runScrape(memoryStore, { sourceIds: [prezzi.id], minHostDelayMs: 0, fetchOptions });
  assert.equal(outcome(run3, prezzi.id), "changed");
  const [signal] = await memoryStore.listSignals({ sourceId: prezzi.id, limit: 5 });
  assert.equal(signal.title, "Vela Software, /prezzi: prezzo da 52 € a 48 €");
  assert.equal(signal.status, "to_verify");
  assert.equal((await memoryStore.getSource(prezzi.id))?.status, "active");
  assert.equal((await memoryStore.getSource(pdf.id))?.lastError, "I PDF non sono ancora supportati.");

  const budget = await runScrape(memoryStore, { sourceIds: [prezzi.id, privato.id], minHostDelayMs: 5000, budgetMs: 1000, fetchOptions });
  assert.equal(budget.results[1].outcome, "skipped", "budget stops the run instead of waiting");

  console.log("scraper selftest: ok");
  console.log(JSON.stringify({ signal, run1: run1.results.map((r) => [r.url.replace(base, ""), r.outcome, r.message ?? ""]) }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => server.close());
