import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ARPA_URL = "https://cloud.arpa.puglia.it/QualitaAria";

/**
 * Near-real-time qualità aria ARPA Puglia (ultimo bollettino giornaliero).
 * Filtra le stazioni con comune Bari quando il campo è presente.
 */
export async function GET() {
  try {
    const url = `${ARPA_URL}?format=GeoJSON`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VistaBari/0.2 (+https://www.competia.work)",
        Accept: "application/json,application/geo+json,*/*",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `ARPA HTTP ${res.status}`,
          hint: "Il servizio ARPA può essere lento o filtrare per User-Agent; riprovare più tardi.",
        },
        { status: 502 },
      );
    }
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: "ARPA response not JSON", preview: text.slice(0, 200) },
        { status: 502 },
      );
    }

    const features =
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { features?: unknown[] }).features)
        ? ((parsed as { features: Array<{ properties?: Record<string, unknown> }> }).features)
        : [];

    const bari = features.filter((f) => {
      const p = f.properties ?? {};
      const comune = String(p.Comune ?? p.comune ?? p.city ?? "").toLowerCase();
      return comune.includes("bari");
    });

    return NextResponse.json(
      {
        ok: true,
        source: ARPA_URL,
        fetchedAt: new Date().toISOString(),
        totalFeatures: features.length,
        bariFeatures: bari.length || features.length,
        // Prefer Bari-only; if metadata lacks comune, return all for client filter
        features: bari.length ? bari : features.slice(0, 50),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 },
    );
  }
}
