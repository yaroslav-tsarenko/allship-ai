import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  account,
  aiMessage,
  aiThread,
  bid,
  dispute,
  lead,
  load,
  loadEvent,
  member,
  message,
  newsletterSubscriber,
  notification,
  notificationPreference,
  organization,
  passkey,
  payment,
  review,
  session,
  user,
} from "@/server/db/schema";

type Section = [name: string, read: () => Promise<unknown>];

function sections(userId: string): Section[] {
  return [
    [
      "profile",
      async () => {
        const [row] = await db
          .select({
            id: user.id,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            emailVerified: user.emailVerified,
            phone: user.phone,
            image: user.image,
            accountType: user.accountType,
            locale: user.locale,
            twoFactorEnabled: user.twoFactorEnabled,
            onboardingCompletedAt: user.onboardingCompletedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1);
        return row ?? null;
      },
    ],
    [
      "signInMethods",
      () =>
        db.select({ provider: account.providerId, createdAt: account.createdAt }).from(account).where(eq(account.userId, userId)),
    ],
    [
      "passkeys",
      () =>
        db.select({ name: passkey.name, deviceType: passkey.deviceType, backedUp: passkey.backedUp, createdAt: passkey.createdAt }).from(passkey).where(eq(passkey.userId, userId)),
    ],
    [
      "sessions",
      () =>
        db
          .select({ createdAt: session.createdAt, updatedAt: session.updatedAt, expiresAt: session.expiresAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
          .from(session)
          .where(eq(session.userId, userId)),
    ],
    [
      "companies",
      () =>
        db
          .select({ organizationId: organization.id, name: organization.name, role: member.role, joinedAt: member.createdAt })
          .from(member)
          .innerJoin(organization, eq(organization.id, member.organizationId))
          .where(eq(member.userId, userId)),
    ],
    [
      "loads",
      async () => {
        const rows = await db
          .select({
            id: load.id,
            publicId: load.publicId,
            category: load.category,
            title: load.title,
            status: load.status,
            pickup: load.pickup,
            dropoff: load.dropoff,
            distanceMiles: load.distanceMiles,
            details: load.details,
            targetPriceCents: load.targetPriceCents,
            publishedAt: load.publishedAt,
            assignedAt: load.assignedAt,
            pickedUpAt: load.pickedUpAt,
            deliveredAt: load.deliveredAt,
            completedAt: load.completedAt,
            cancelledReason: load.cancelledReason,
            createdAt: load.createdAt,
          })
          .from(load)
          .where(eq(load.shipperId, userId))
          .orderBy(asc(load.createdAt));
        if (!rows.length) return [];
        const events = await db
          .select({ loadId: loadEvent.loadId, type: loadEvent.type, fromStatus: loadEvent.fromStatus, toStatus: loadEvent.toStatus, createdAt: loadEvent.createdAt })
          .from(loadEvent)
          .where(inArray(loadEvent.loadId, rows.map((r) => r.id)))
          .orderBy(asc(loadEvent.createdAt));
        return rows.map(({ id, ...rest }) => ({
          ...rest,
          history: events.filter((e) => e.loadId === id).map((e) => ({ type: e.type, fromStatus: e.fromStatus, toStatus: e.toStatus, createdAt: e.createdAt })),
        }));
      },
    ],
    [
      "bids",
      () =>
        db
          .select({
            load: load.publicId,
            amountCents: bid.amountCents,
            message: bid.message,
            status: bid.status,
            estimatedPickupAt: bid.estimatedPickupAt,
            estimatedDeliveryAt: bid.estimatedDeliveryAt,
            aiAssisted: bid.aiAssisted,
            createdAt: bid.createdAt,
          })
          .from(bid)
          .innerJoin(load, eq(load.id, bid.loadId))
          .where(eq(bid.createdBy, userId))
          .orderBy(asc(bid.createdAt)),
    ],
    [
      "payments",
      () =>
        db
          .select({
            load: load.publicId,
            amountCents: payment.amountCents,
            refundedCents: payment.refundedCents,
            currency: payment.currency,
            status: payment.status,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            createdAt: payment.createdAt,
          })
          .from(payment)
          .innerJoin(load, eq(load.id, payment.loadId))
          .where(eq(payment.shipperId, userId)),
    ],
    [
      "messagesSent",
      () =>
        db
          .select({ conversationId: message.conversationId, body: message.body, attachments: message.attachments, editedAt: message.editedAt, createdAt: message.createdAt })
          .from(message)
          .where(eq(message.senderId, userId))
          .orderBy(asc(message.createdAt)),
    ],
    [
      "reviewsWritten",
      () =>
        db
          .select({ load: load.publicId, carrier: organization.name, rating: review.rating, body: review.body, carrierReply: review.carrierReply, createdAt: review.createdAt })
          .from(review)
          .innerJoin(load, eq(load.id, review.loadId))
          .innerJoin(organization, eq(organization.id, review.carrierOrgId))
          .where(eq(review.shipperId, userId)),
    ],
    [
      "disputesOpened",
      () =>
        db
          .select({ load: load.publicId, reason: dispute.reason, details: dispute.details, status: dispute.status, resolution: dispute.resolution, refundCents: dispute.refundCents, createdAt: dispute.createdAt, resolvedAt: dispute.resolvedAt })
          .from(dispute)
          .innerJoin(load, eq(load.id, dispute.loadId))
          .where(eq(dispute.openedBy, userId)),
    ],
    [
      "notifications",
      () =>
        db
          .select({ type: notification.type, title: notification.title, body: notification.body, href: notification.href, readAt: notification.readAt, createdAt: notification.createdAt })
          .from(notification)
          .where(eq(notification.userId, userId))
          .orderBy(asc(notification.createdAt)),
    ],
    [
      "notificationPreferences",
      () => db.select({ channel: notificationPreference.channel, type: notificationPreference.type, enabled: notificationPreference.enabled }).from(notificationPreference).where(eq(notificationPreference.userId, userId)),
    ],
    [
      "assistantConversations",
      async () => {
        const threads = await db.select({ id: aiThread.id, title: aiThread.title, createdAt: aiThread.createdAt }).from(aiThread).where(eq(aiThread.userId, userId)).orderBy(asc(aiThread.createdAt));
        if (!threads.length) return [];
        const messages = await db
          .select({ threadId: aiMessage.threadId, role: aiMessage.role, parts: aiMessage.parts, createdAt: aiMessage.createdAt })
          .from(aiMessage)
          .where(inArray(aiMessage.threadId, threads.map((t) => t.id)))
          .orderBy(asc(aiMessage.createdAt));
        return threads.map((t) => ({
          ...t,
          messages: messages.filter((m) => m.threadId === t.id).map((m) => ({ role: m.role, parts: m.parts, createdAt: m.createdAt })),
        }));
      },
    ],
    [
      "formSubmissions",
      () => db.select({ type: lead.type, name: lead.name, email: lead.email, phone: lead.phone, payload: lead.payload, createdAt: lead.createdAt }).from(lead).where(eq(lead.userId, userId)),
    ],
    [
      "newsletter",
      async () => {
        const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1);
        if (!u) return null;
        const [row] = await db
          .select({ audience: newsletterSubscriber.audience, confirmedAt: newsletterSubscriber.confirmedAt, unsubscribedAt: newsletterSubscriber.unsubscribedAt, createdAt: newsletterSubscriber.createdAt })
          .from(newsletterSubscriber)
          .where(eq(newsletterSubscriber.email, u.email))
          .limit(1);
        return row ?? null;
      },
    ],
  ];
}

export function exportStream(userId: string) {
  const encoder = new TextEncoder();
  const parts = sections(userId);
  let index = -1;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index === -1) {
        controller.enqueue(encoder.encode(`{\n  "format": "allship-account-export/1",\n  "generatedAt": ${JSON.stringify(new Date().toISOString())}`));
        index = 0;
        return;
      }
      if (index >= parts.length) {
        controller.enqueue(encoder.encode("\n}\n"));
        controller.close();
        return;
      }
      const [name, read] = parts[index++]!;
      const value = await read();
      controller.enqueue(encoder.encode(`,\n  ${JSON.stringify(name)}: ${JSON.stringify(value, null, 2).replace(/\n/g, "\n  ")}`));
    },
  });
}
