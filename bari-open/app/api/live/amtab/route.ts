import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AMTAB_URL =
  "https://avl.amtab.it/WSExportGTFS_RT/api/gtfs/VechiclePosition";

type AmtabEntity = {
  Id?: string;
  Vehicle?: {
    Position?: { Latitude?: number; Longitude?: number; Bearing?: number };
    Trip?: { TripId?: string; RouteId?: string };
    Vehicle?: { Id?: string; Label?: string };
    CurrentStatus?: number | string;
    CongestionLevel?: string;
    OccupancyStatus?: string;
    Timestamp?: number;
  };
};

/**
 * Proxy cache-breve verso GTFS-RT AMTAB (posizioni mezzi).
 * Nessuna chiave API; solo dati pubblici del gestore TPL.
 */
export async function GET() {
  try {
    const res = await fetch(AMTAB_URL, {
      headers: {
        "User-Agent": "VistaBari/0.2 (+https://www.competia.work)",
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `AMTAB HTTP ${res.status}` },
        { status: 502 },
      );
    }
    const body = (await res.json()) as {
      Header?: { Timestamp?: number };
      Entities?: AmtabEntity[];
    };
    const vehicles = (body.Entities ?? [])
      .map((e) => {
        const v = e.Vehicle;
        const lat = v?.Position?.Latitude;
        const lon = v?.Position?.Longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return {
          id: v?.Vehicle?.Id || e.Id || "",
          label: v?.Vehicle?.Label || v?.Vehicle?.Id || e.Id || "",
          routeId: v?.Trip?.RouteId || "",
          tripId: v?.Trip?.TripId || "",
          latitude: lat as number,
          longitude: lon as number,
          bearing: v?.Position?.Bearing ?? null,
          occupancy: v?.OccupancyStatus ?? null,
          congestion: v?.CongestionLevel ?? null,
          timestamp: v?.Timestamp ?? body.Header?.Timestamp ?? null,
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      {
        ok: true,
        source: AMTAB_URL,
        fetchedAt: new Date().toISOString(),
        count: vehicles.length,
        vehicles,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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
