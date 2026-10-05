"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { carrierOnboardingSchema, shipperOnboardingSchema } from "@/features/onboarding/schemas";
import { auth } from "@/server/auth/auth";
import { checkCarrierWithFmcsa } from "@/server/carriers/fmcsa";
import { db } from "@/server/db/client";
import { carrierProfile, member, user } from "@/server/db/schema";
import { enrollUser, safely } from "@/server/nurture";
import { ActionError, authedAction } from "./safe-action";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export const completeShipperOnboarding = authedAction
  .inputSchema(shipperOnboardingSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.accountType !== "shipper") throw new ActionError("This step is for shipper accounts.");
    await db
      .update(user)
      .set({
        firstName: parsedInput.firstName,
        lastName: parsedInput.lastName,
        name: `${parsedInput.firstName} ${parsedInput.lastName}`,
        phone: parsedInput.phone || null,
        onboardingCompletedAt: new Date(),
      })
      .where(eq(user.id, ctx.user.id));
    return { ok: true };
  });

export const completeCarrierOnboarding = authedAction
  .inputSchema(carrierOnboardingSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (ctx.user.accountType !== "carrier") throw new ActionError("This step is for carrier accounts.");

    const existingDot = await db
      .select({ orgId: carrierProfile.orgId })
      .from(carrierProfile)
      .where(eq(carrierProfile.usdotNumber, parsedInput.usdotNumber))
      .limit(1);
    if (existingDot.length > 0) {
      throw new ActionError("A company with this USDOT number is already on AllShip. Ask its owner to invite you.");
    }

    const [existingMembership] = await db.select({ id: member.id }).from(member).where(eq(member.userId, ctx.user.id)).limit(1);
    if (existingMembership) throw new ActionError("You already belong to a carrier company.");

    const requestHeaders = await headers();
    const org = await auth.api.createOrganization({
      headers: requestHeaders,
      body: {
        name: parsedInput.dbaName || parsedInput.legalName,
        slug: `${slugify(parsedInput.dbaName || parsedInput.legalName)}-${parsedInput.usdotNumber}`,
      },
    });
    if (!org) throw new ActionError("We could not create your company. Try again.");

    await db.transaction(async (tx) => {
      await tx.insert(carrierProfile).values({
        orgId: org.id,
        legalName: parsedInput.legalName,
        dbaName: parsedInput.dbaName || null,
        usdotNumber: parsedInput.usdotNumber,
        mcNumber: parsedInput.mcNumber || null,
        phone: parsedInput.phone,
        fmcsaStatus: "pending",
      });
      await tx
        .update(user)
        .set({
          firstName: parsedInput.firstName,
          lastName: parsedInput.lastName,
          name: `${parsedInput.firstName} ${parsedInput.lastName}`,
          phone: parsedInput.phone,
          onboardingCompletedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id));
    });

    await auth.api.setActiveOrganization({ headers: requestHeaders, body: { organizationId: org.id } });
    await checkCarrierWithFmcsa(org.id);
    await safely("carrier onboarded", () => enrollUser("carrier_activation", ctx.user.id, { context: { orgId: org.id } }));
    return { ok: true };
  });
