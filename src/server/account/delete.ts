import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  account,
  aiThread,
  bid,
  conversationRead,
  driverLocation,
  invitation,
  lead,
  load,
  member,
  newsletterSubscriber,
  notification,
  notificationPreference,
  passkey,
  session,
  tourProgress,
  twoFactor,
  user,
  verification,
} from "@/server/db/schema";

export const DELETED_NAME = "Deleted user";

export function anonymizedEmail(userId: string) {
  return `deleted-${userId.toLowerCase().replace(/[^a-z0-9]/g, "")}@deleted.allship.invalid`;
}

export async function anonymizeAccount(userId: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ email: user.email }).from(user).where(eq(user.id, userId)).for("update").limit(1);
    if (!current) throw new Error("account not found");
    const oldEmail = current.email.toLowerCase();

    const withdrawnBids = await tx
      .update(bid)
      .set({ status: "withdrawn" })
      .where(and(eq(bid.createdBy, userId), eq(bid.status, "active")))
      .returning({ id: bid.id });
    const cancelledDrafts = await tx
      .update(load)
      .set({ status: "cancelled", cancelledReason: "Account closed" })
      .where(and(eq(load.shipperId, userId), inArray(load.status, ["draft", "expired"])))
      .returning({ id: load.id });

    await tx.delete(session).where(eq(session.userId, userId));
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(passkey).where(eq(passkey.userId, userId));
    await tx.delete(twoFactor).where(eq(twoFactor.userId, userId));
    await tx.delete(verification).where(or(eq(verification.identifier, oldEmail), eq(verification.identifier, userId)));
    await tx.delete(aiThread).where(eq(aiThread.userId, userId));
    await tx.delete(notification).where(eq(notification.userId, userId));
    await tx.delete(notificationPreference).where(eq(notificationPreference.userId, userId));
    await tx.delete(tourProgress).where(eq(tourProgress.userId, userId));
    await tx.delete(conversationRead).where(eq(conversationRead.userId, userId));
    await tx.delete(driverLocation).where(eq(driverLocation.driverId, userId));
    await tx.delete(invitation).where(and(or(eq(invitation.inviterId, userId), eq(invitation.email, oldEmail)), eq(invitation.status, "pending")));
    await tx.delete(member).where(eq(member.userId, userId));
    await tx.delete(newsletterSubscriber).where(eq(newsletterSubscriber.email, oldEmail));
    await tx.update(lead).set({ name: null, email: null, phone: null, userId: null }).where(eq(lead.userId, userId));

    await tx
      .update(user)
      .set({
        name: DELETED_NAME,
        firstName: null,
        lastName: null,
        phone: null,
        image: null,
        legacyId: null,
        email: anonymizedEmail(userId),
        emailVerified: false,
        twoFactorEnabled: false,
        role: "user",
        banned: true,
        banReason: "Account deleted by its owner",
        banExpires: null,
      })
      .where(eq(user.id, userId));

    return { withdrawnBids: withdrawnBids.length, cancelledDrafts: cancelledDrafts.length };
  });
}
