import type { NextRequest } from "next/server";
import { isVpicCatalog, modelYears } from "@/features/vehicles/catalog";
import { getModels } from "@/server/vehicles/vpic";
import { vehicleJson } from "@/server/vehicles/respond";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const catalog = params.get("catalog") ?? "";
  const make = (params.get("make") ?? "").trim().slice(0, 60);
  const year = Number(params.get("year"));
  if (!isVpicCatalog(catalog) || !make || !modelYears().includes(year)) return Response.json({ error: "Choose a catalog, make and model year" }, { status: 400 });
  const result = await getModels(catalog, make, year);
  return vehicleJson(result.ok ? { available: true, items: result.data } : { available: false, items: [] }, result.ok);
}
