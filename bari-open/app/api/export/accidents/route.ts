import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { loadBundle } from "@/lib/data";

export const dynamic = "force-static";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const roadType = url.searchParams.get("roadType") || "";
  const pavement = url.searchParams.get("pavement") || "";
  const weather = url.searchParams.get("weather") || "";
  const propertyDamage = url.searchParams.get("propertyDamage");
  const injuries = url.searchParams.get("injuries");
  const year = url.searchParams.get("year") || "";

  const bundle = await loadBundle();
  const filtered = bundle.accidents.filter((a) => {
    if (year && !a.date.startsWith(year)) return false;
    if (roadType && a.roadType !== roadType) return false;
    if (pavement === "wet" && !/bagnato|umid|brina|viscido/i.test(a.pavementState)) {
      return false;
    }
    if (pavement === "dry" && !/asciutto/i.test(a.pavementState)) return false;
    if (weather && weather !== "tutti" && !a.weather.toLowerCase().includes(weather.toLowerCase())) {
      return false;
    }
    if (propertyDamage === "1" && !a.propertyDamage) return false;
    if (propertyDamage === "0" && a.propertyDamage) return false;
    if (injuries === "1" && !a.injuries) return false;
    if (injuries === "0" && a.injuries) return false;
    return true;
  });

  const csv = toCsv(
    [
      "date",
      "latitude",
      "longitude",
      "roadType",
      "pavementState",
      "weather",
      "propertyDamage",
      "injuries",
    ],
    filtered.map((a) => [
      a.date,
      a.latitude,
      a.longitude,
      a.roadType,
      a.pavementState,
      a.weather,
      a.propertyDamage,
      a.injuries,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vista-bari-accidents-filtered.csv"`,
      "Cache-Control": "public, s-maxage=300",
      "X-Result-Count": String(filtered.length),
    },
  });
}
