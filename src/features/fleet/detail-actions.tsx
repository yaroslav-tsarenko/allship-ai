"use client";

import { useRouter } from "next/navigation";
import type { FleetDriver } from "@/server/fleet/queries";
import { DriverMenu } from "./driver-menu";

export function DetailActions({ driver, canRemove }: { driver: FleetDriver; canRemove: boolean }) {
  const router = useRouter();
  return <DriverMenu driver={driver} canRemove={canRemove} onChanged={() => router.push("/app/fleet")} />;
}
