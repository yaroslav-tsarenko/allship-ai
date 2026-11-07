import { decodeVin } from "@/server/vehicles/vpic";
import { vehicleJson } from "@/server/vehicles/respond";

export async function GET(_request: Request, { params }: { params: Promise<{ vin: string }> }) {
  const { vin } = await params;
  const result = await decodeVin(decodeURIComponent(vin).slice(0, 40));
  if (!result.ok && "invalid" in result) return Response.json({ error: result.invalid }, { status: 422 });
  return vehicleJson(result.ok ? { available: true, vehicle: result.data } : { available: false, vehicle: null }, result.ok);
}
