import type { NextRequest } from "next/server";
import { isVpicCatalog } from "@/features/vehicles/catalog";
import { getMakes } from "@/server/vehicles/vpic";
import { vehicleJson } from "@/server/vehicles/respond";

export async function GET(request: NextRequest) {
  const catalog = request.nextUrl.searchParams.get("catalog") ?? "";
  if (!isVpicCatalog(catalog)) return Response.json({ error: "Unknown catalog" }, { status: 400 });
  const result = await getMakes(catalog);
  return vehicleJson(result.ok ? { available: true, items: result.data } : { available: false, items: [] }, result.ok);
}
