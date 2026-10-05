import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { carrierProfile, member, organization, user } from "@/server/db/schema";

export type ViewerRole = "shipper" | "owner" | "dispatcher" | "driver";

export const getViewer = cache(async () => {
  const session = await requireSession();
  const [row] = await db
    .select({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        accountType: user.accountType,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        onboardingCompletedAt: user.onboardingCompletedAt,
        banned: user.banned,
      },
      org: {
        orgId: organization.id,
        orgName: organization.name,
        role: member.role,
        fmcsaStatus: carrierProfile.fmcsaStatus,
        payoutsEnabled: carrierProfile.payoutsEnabled,
      },
    })
    .from(user)
    .leftJoin(member, eq(member.userId, user.id))
    .leftJoin(organization, eq(member.organizationId, organization.id))
    .leftJoin(carrierProfile, eq(carrierProfile.orgId, organization.id))
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!row || row.user.banned) redirect("/sign-in");

  const org = row.org?.orgId ? row.org : null;
  const role: ViewerRole = org ? (org.role === "driver" ? "driver" : org.role === "owner" ? "owner" : "dispatcher") : "shipper";

  return {
    session,
    user: row.user,
    role,
    isAdmin: row.user.role === "admin",
    org,
    needsOnboarding: !row.user.onboardingCompletedAt && role !== "driver",
  };
});

export type Viewer = Awaited<ReturnType<typeof getViewer>>;
