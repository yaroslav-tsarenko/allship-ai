import "server-only";
import { and, count, desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notification, notificationPreference } from "@/server/db/schema";

export type NotificationItem = { id: string; type: string; title: string; body: string | null; href: string | null; readAt: string | null; createdAt: string };

export const NOTIFICATION_PAGE_SIZE = 30;

export async function listNotifications(userId: string, { before, unreadOnly = false, limit = NOTIFICATION_PAGE_SIZE }: { before?: string; unreadOnly?: boolean; limit?: number } = {}) {
  const size = Math.min(Math.max(limit, 1), 100);
  const rows = await db
    .select()
    .from(notification)
    .where(and(eq(notification.userId, userId), unreadOnly ? isNull(notification.readAt) : undefined, before ? lt(notification.id, before) : undefined))
    .orderBy(desc(notification.id))
    .limit(size + 1);
  const items: NotificationItem[] = rows.slice(0, size).map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));
  return { items, nextCursor: rows.length > size ? (items.at(-1)?.id ?? null) : null };
}

export async function unreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notification)
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
  return Number(row?.value ?? 0);
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, userId), inArray(notification.id, ids), isNull(notification.readAt)));
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
}

export async function markConversationNotificationsRead(userId: string, conversationId: string) {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, userId), eq(notification.type, "message"), eq(notification.href, `/app/messages/${conversationId}`), isNull(notification.readAt)));
}

export const emailGroups = [
  { key: "bids", label: "Bids and booking", description: "New bids, accepted bids, bookings and cancellations", types: ["bid_received", "instant_booking", "bid_won", "bid_declined", "load_booked", "load_cancelled"] },
  { key: "trips", label: "Trip updates", description: "Driver assigned, pickup, delivery, completion and disputes", types: ["trip_assigned", "driver_assigned", "trip_started", "picked_up", "delivered", "completed", "dispute_opened", "dispute_resolved"] },
  { key: "messages", label: "Messages", description: "New messages when you're away. We send at most one every 30 minutes per conversation.", types: ["message"] },
  { key: "payouts", label: "Payouts", description: "Transfers to your bank account", types: ["payout_sent", "payout_failed"] },
  { key: "reviews", label: "Reviews", description: "New reviews of your company", types: ["review_received"] },
  { key: "product", label: "Product news", description: "Occasional updates about new AllShip features", types: ["product_news"] },
] as const;

export type EmailGroupKey = (typeof emailGroups)[number]["key"];

export function emailGroupsFor(role: "shipper" | "owner" | "dispatcher" | "driver"): EmailGroupKey[] {
  if (role === "shipper") return ["bids", "trips", "messages", "product"];
  if (role === "driver") return ["trips", "messages", "product"];
  if (role === "dispatcher") return ["bids", "trips", "messages", "reviews", "product"];
  return ["bids", "trips", "messages", "payouts", "reviews", "product"];
}

export async function emailPreferences(userId: string): Promise<Record<EmailGroupKey, boolean>> {
  const rows = await db
    .select({ type: notificationPreference.type, enabled: notificationPreference.enabled })
    .from(notificationPreference)
    .where(and(eq(notificationPreference.userId, userId), eq(notificationPreference.channel, "email")));
  const off = new Set(rows.filter((r) => !r.enabled).map((r) => r.type));
  return Object.fromEntries(emailGroups.map((g) => [g.key, !g.types.some((t) => off.has(t))])) as Record<EmailGroupKey, boolean>;
}

export async function setEmailPreference(userId: string, group: EmailGroupKey, enabled: boolean) {
  const def = emailGroups.find((g) => g.key === group);
  if (!def) return;
  await db
    .insert(notificationPreference)
    .values(def.types.map((type) => ({ userId, channel: "email" as const, type, enabled })))
    .onConflictDoUpdate({ target: [notificationPreference.userId, notificationPreference.channel, notificationPreference.type], set: { enabled } });
}
