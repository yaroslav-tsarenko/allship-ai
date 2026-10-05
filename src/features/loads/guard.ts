import "server-only";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getActor } from "@/server/actor";
import { db } from "@/server/db/client";
import { load } from "@/server/db/schema";
import { getViewer } from "@/server/viewer/viewer";

async function carrierDestination(role: string, userId: string, orgId: string | null, publicId?: string) {
  if (role === "driver") return publicId ? `/app/trips/${publicId}` : "/app/trips";
  if (!publicId) return "/app/board";
  const [row] = orgId ? await db.select({ id: load.id }).from(load).where(and(eq(load.publicId, publicId), eq(load.carrierOrgId, orgId))).limit(1) : [];
  return row ? `/app/trips/${publicId}` : `/app/board/${publicId}`;
}

export async function requireShipper(publicId?: string) {
  const viewer = await getViewer();
  if (viewer.needsOnboarding) redirect("/app/onboarding");
  if (viewer.role !== "shipper" || viewer.user.accountType !== "shipper") {
    if (viewer.role === "shipper") redirect("/app");
    redirect(await carrierDestination(viewer.role, viewer.user.id, viewer.org?.orgId ?? null, publicId));
  }
  return { viewer, actor: await getActor(viewer.user.id) };
}
