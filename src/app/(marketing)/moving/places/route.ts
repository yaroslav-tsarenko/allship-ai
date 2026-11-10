import type { NextRequest } from "next/server";
import { allCityData } from "@/server/matcher/city-data.generated";
import { zip3Data } from "@/server/matcher/geo-data";
import { suggestPlaces } from "@/server/matcher/places";

const geoData = { zip3Data, cityData: allCityData };

export function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  const items = suggestPlaces(q, geoData);
  return Response.json({ items }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400", "X-Robots-Tag": "noindex" } });
}
