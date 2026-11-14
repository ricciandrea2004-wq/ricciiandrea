/** Earth-mean radius in metres. */
const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in metres (Haversine). */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

type Ring = number[][];

function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  // Ray casting; ring is [lon, lat][]
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonCoords(lon: number, lat: number, rings: Ring[]): boolean {
  if (!rings.length) return false;
  if (!pointInRing(lon, lat, rings[0])) return false;
  // holes
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lon, lat, rings[i])) return false;
  }
  return true;
}

/** Point-in-polygon for GeoJSON Polygon / MultiPolygon (lon/lat WGS84). */
export function pointInGeometry(
  lon: number,
  lat: number,
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  },
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonCoords(lon, lat, geometry.coordinates as Ring[]);
  }
  for (const poly of geometry.coordinates as Ring[][]) {
    if (pointInPolygonCoords(lon, lat, poly)) return true;
  }
  return false;
}

/** Drop every `stride`-th vertex on rings (keeps first/last) to shrink GeoJSON. */
export function simplifyFeatureCollection<
  T extends {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: Record<string, unknown>;
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
      };
    }>;
  },
>(fc: T, stride = 4): T {
  const simplifyRing = (ring: Ring): Ring => {
    if (ring.length <= 8 || stride <= 1) return ring;
    const out: Ring = [];
    for (let i = 0; i < ring.length; i++) {
      if (i === 0 || i === ring.length - 1 || i % stride === 0) out.push(ring[i]);
    }
    // ensure closed
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([...first]);
    return out;
  };

  return {
    ...fc,
    features: fc.features.map((f) => {
      if (f.geometry.type === "Polygon") {
        return {
          ...f,
          geometry: {
            type: "Polygon" as const,
            coordinates: (f.geometry.coordinates as Ring[]).map(simplifyRing),
          },
        };
      }
      return {
        ...f,
        geometry: {
          type: "MultiPolygon" as const,
          coordinates: (f.geometry.coordinates as Ring[][]).map((poly) =>
            poly.map(simplifyRing),
          ),
        },
      };
    }),
  };
}
