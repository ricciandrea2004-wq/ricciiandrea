import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Open-Meteo forecast for Bari centro (no API key). */
const LAT = 41.1171;
const LON = 16.8719;

export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(LAT));
    url.searchParams.set("longitude", String(LON));
    url.searchParams.set("current", "temperature_2m,precipitation,weather_code,wind_speed_10m");
    url.searchParams.set("timezone", "Europe/Rome");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "VistaBari/0.3" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Open-Meteo HTTP ${res.status}` },
        { status: 502 },
      );
    }
    const body = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        precipitation?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        time?: string;
      };
    };
    const c = body.current ?? {};
    return NextResponse.json(
      {
        ok: true,
        source: "Open-Meteo",
        latitude: LAT,
        longitude: LON,
        fetchedAt: new Date().toISOString(),
        temperatureC: c.temperature_2m ?? null,
        precipitationMm: c.precipitation ?? null,
        weatherCode: c.weather_code ?? null,
        windSpeedKmh: c.wind_speed_10m ?? null,
        observationTime: c.time ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
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
