import "server-only";
import { randomUUID } from "node:crypto";
import { and, count, countDistinct, desc, eq, gt, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { after } from "next/server";
import { ActionError } from "@/server/actions/safe-action";
import type { Actor } from "@/server/actor";
import { db } from "@/server/db/client";
import { conversation, conversationRead, load, member, message, notification, organization, rateLimit, user, type MessageAttachment } from "@/server/db/schema";
import type { LoadStatus } from "@/server/db/schema/enums";
import { notifyUsers } from "@/server/notifications/notify";
import { consumeRateLimit } from "@/server/rate-limit";
import { publish } from "@/server/realtime/publish";
import { topics } from "@/server/realtime/topics";
import { ALLOWED_UPLOAD_TYPES, objectExists, signedReadUrl } from "@/server/storage/storage";
import { log } from "@/lib/log";
import { maskProfanity } from "@/lib/validation/text-policy";

export type ChatActor = Pick<Actor, "userId" | "orgId" | "orgRole" | "isAdmin">;
export type ChatRole = "shipper" | "carrier" | "driver" | "admin";
export type ChatSide = "shipper" | "carrier" | "driver";

export const MESSAGE_MAX_LENGTH = 4000;
export const MESSAGE_PAGE_SIZE = 50;
export const MAX_ATTACHMENTS = 6;
const EMAIL_COOLDOWN_MS = 30 * 60 * 1000;
const ACTIVE_READER_MS = 2 * 60 * 1000;

export type ChatAttachment = MessageAttachment & { url: string | null };

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderSide: ChatSide;
  body: string;
  attachments: ChatAttachment[];
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  loadPublicId: string;
  loadTitle: string;
  loadStatus: LoadStatus;
  counterpart: string;
  role: ChatRole;
  lastMessage: { body: string; senderId: string; senderName: string; attachments: number; at: string } | null;
  lastActivityAt: string;
  unread: number;
};

export type ConversationDetail = {
  id: string;
  loadId: string;
  loadPublicId: string;
  loadTitle: string;
  loadStatus: LoadStatus;
  loadHref: string;
  role: ChatRole;
  readOnly: boolean;
  counterpart: string;
  participants: { id: string; name: string; side: ChatSide }[];
};

export type AttachmentInput = { key: string; name: string; contentType: string; size: number };

function isStaff(actor: ChatActor) {
  return Boolean(actor.orgId && (actor.orgRole === "owner" || actor.orgRole === "dispatcher"));
}

function scopeFor(actor: ChatActor): SQL {
  const parts: SQL[] = [eq(conversation.shipperId, actor.userId)];
  if (actor.orgId) parts.push(and(eq(load.driverId, actor.userId), eq(conversation.carrierOrgId, actor.orgId))!);
  if (isStaff(actor)) parts.push(eq(conversation.carrierOrgId, actor.orgId!));
  return or(...parts)!;
}

function roleFor(actor: ChatActor, row: { shipperId: string; carrierOrgId: string; driverId: string | null }): ChatRole | null {
  if (row.shipperId === actor.userId) return "shipper";
  if (row.driverId === actor.userId && actor.orgId === row.carrierOrgId) return "driver";
  if (isStaff(actor) && actor.orgId === row.carrierOrgId) return "carrier";
  if (actor.isAdmin) return "admin";
  return null;
}

function sideOf(senderId: string, row: { shipperId: string; driverId: string | null }): ChatSide {
  if (senderId === row.shipperId) return "shipper";
  if (senderId === row.driverId) return "driver";
  return "carrier";
}

export function loadHrefFor(role: ChatRole, publicId: string) {
  if (role === "shipper") return `/app/loads/${publicId}`;
  if (role === "admin") return `/admin/loads/${publicId}`;
  return `/app/trips/${publicId}`;
}

async function access(actor: ChatActor, conversationId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) throw new ActionError("Conversation not found.");
  const [row] = await db
    .select({
      id: conversation.id,
      loadId: conversation.loadId,
      shipperId: conversation.shipperId,
      carrierOrgId: conversation.carrierOrgId,
      driverId: load.driverId,
      publicId: load.publicId,
      title: load.title,
      status: load.status,
      shipperName: user.name,
      carrierName: organization.name,
    })
    .from(conversation)
    .innerJoin(load, eq(load.id, conversation.loadId))
    .innerJoin(user, eq(user.id, conversation.shipperId))
    .innerJoin(organization, eq(organization.id, conversation.carrierOrgId))
    .where(eq(conversation.id, conversationId))
    .limit(1);
  const role = row ? roleFor(actor, row) : null;
  if (!row || !role) throw new ActionError("Conversation not found.");
  return { row, role };
}

type AccessRow = Awaited<ReturnType<typeof access>>["row"];

async function toMessages(rows: (typeof message.$inferSelect & { senderName: string })[], ctx: Pick<AccessRow, "shipperId" | "driverId">): Promise<ChatMessage[]> {
  return Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName,
      senderSide: sideOf(m.senderId, ctx),
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      attachments: await Promise.all(m.attachments.map(async (a) => ({ ...a, url: await signedReadUrl(a.storageKey).catch(() => null) }))),
    })),
  );
}

function messageColumns() {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    attachments: message.attachments,
    editedAt: message.editedAt,
    createdAt: message.createdAt,
    senderName: user.name,
  };
}

export async function listConversations(actor: ChatActor, limit = 100): Promise<ConversationSummary[]> {
  const rows = await db
    .select({
      id: conversation.id,
      shipperId: conversation.shipperId,
      carrierOrgId: conversation.carrierOrgId,
      driverId: load.driverId,
      publicId: load.publicId,
      title: load.title,
      status: load.status,
      shipperName: user.name,
      carrierName: organization.name,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
    })
    .from(conversation)
    .innerJoin(load, eq(load.id, conversation.loadId))
    .innerJoin(user, eq(user.id, conversation.shipperId))
    .innerJoin(organization, eq(organization.id, conversation.carrierOrgId))
    .where(scopeFor(actor))
    .orderBy(sql`coalesce(${conversation.lastMessageAt}, ${conversation.createdAt}) desc`)
    .limit(limit);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [lastRows, unreadRows] = await Promise.all([
    db
      .selectDistinctOn([message.conversationId], {
        conversationId: message.conversationId,
        body: message.body,
        senderId: message.senderId,
        senderName: user.name,
        attachments: message.attachments,
        createdAt: message.createdAt,
      })
      .from(message)
      .innerJoin(user, eq(user.id, message.senderId))
      .where(inArray(message.conversationId, ids))
      .orderBy(message.conversationId, desc(message.id)),
    db
      .select({ conversationId: message.conversationId, unread: count() })
      .from(message)
      .leftJoin(conversationRead, and(eq(conversationRead.conversationId, message.conversationId), eq(conversationRead.userId, actor.userId)))
      .where(and(inArray(message.conversationId, ids), ne(message.senderId, actor.userId), or(isNull(conversationRead.lastReadAt), gt(message.createdAt, conversationRead.lastReadAt))))
      .groupBy(message.conversationId),
  ]);
  const last = new Map(lastRows.map((r) => [r.conversationId, r]));
  const unread = new Map(unreadRows.map((r) => [r.conversationId, Number(r.unread)]));
  return rows.map((r) => {
    const role = roleFor(actor, r) ?? "admin";
    const lm = last.get(r.id);
    return {
      id: r.id,
      loadPublicId: r.publicId,
      loadTitle: r.title,
      loadStatus: r.status,
      counterpart: role === "shipper" ? r.carrierName : r.shipperName,
      role,
      lastMessage: lm ? { body: lm.body, senderId: lm.senderId, senderName: lm.senderName, attachments: lm.attachments.length, at: lm.createdAt.toISOString() } : null,
      lastActivityAt: (r.lastMessageAt ?? r.createdAt).toISOString(),
      unread: unread.get(r.id) ?? 0,
    };
  });
}

export async function unreadConversationCount(actor: ChatActor) {
  const [row] = await db
    .select({ value: countDistinct(message.conversationId) })
    .from(message)
    .innerJoin(conversation, eq(conversation.id, message.conversationId))
    .innerJoin(load, eq(load.id, conversation.loadId))
    .leftJoin(conversationRead, and(eq(conversationRead.conversationId, message.conversationId), eq(conversationRead.userId, actor.userId)))
    .where(and(scopeFor(actor), ne(message.senderId, actor.userId), or(isNull(conversationRead.lastReadAt), gt(message.createdAt, conversationRead.lastReadAt))));
  return Number(row?.value ?? 0);
}

async function participantsOf(row: Pick<AccessRow, "shipperId" | "carrierOrgId" | "driverId" | "shipperName">) {
  const staff = await db
    .select({ id: user.id, name: user.name })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, row.carrierOrgId), inArray(member.role, ["owner", "dispatcher"])));
  const people: ConversationDetail["participants"] = [{ id: row.shipperId, name: row.shipperName, side: "shipper" }];
  for (const s of staff) if (s.id !== row.driverId) people.push({ id: s.id, name: s.name, side: "carrier" });
  if (row.driverId) {
    const [driver] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, row.driverId)).limit(1);
    if (driver) people.push({ id: driver.id, name: driver.name, side: "driver" });
  }
  return people;
}

export async function getConversation(actor: ChatActor, conversationId: string, { before, limit = MESSAGE_PAGE_SIZE }: { before?: string; limit?: number } = {}) {
  const { row, role } = await access(actor, conversationId);
  const size = Math.min(Math.max(limit, 1), 100);
  const [rows, participants] = await Promise.all([
    db
      .select(messageColumns())
      .from(message)
      .innerJoin(user, eq(user.id, message.senderId))
      .where(and(eq(message.conversationId, row.id), before ? lt(message.id, before) : undefined))
      .orderBy(desc(message.id))
      .limit(size + 1),
    participantsOf(row),
  ]);
  const hasMore = rows.length > size;
  const page = rows.slice(0, size).reverse();
  const detail: ConversationDetail = {
    id: row.id,
    loadId: row.loadId,
    loadPublicId: row.publicId,
    loadTitle: row.title,
    loadStatus: row.status,
    loadHref: loadHrefFor(role, row.publicId),
    role,
    readOnly: role === "admin",
    counterpart: role === "shipper" ? row.carrierName : row.shipperName,
    participants,
  };
  return { conversation: detail, messages: await toMessages(page, row), hasMore };
}

export async function messagesAfter(actor: ChatActor, conversationId: string, afterId: string | null) {
  const { row } = await access(actor, conversationId);
  const rows = await db
    .select(messageColumns())
    .from(message)
    .innerJoin(user, eq(user.id, message.senderId))
    .where(and(eq(message.conversationId, row.id), afterId ? gt(message.id, afterId) : undefined))
    .orderBy(desc(message.id))
    .limit(100);
  return toMessages(rows.reverse(), row);
}

export async function markRead(actor: ChatActor, conversationId: string) {
  const { row, role } = await access(actor, conversationId);
  if (role === "admin") return;
  await db
    .insert(conversationRead)
    .values({ conversationId: row.id, userId: actor.userId, lastReadAt: new Date() })
    .onConflictDoUpdate({ target: [conversationRead.conversationId, conversationRead.userId], set: { lastReadAt: new Date() } });
}

async function validateAttachments(loadId: string, inputs: AttachmentInput[]): Promise<MessageAttachment[]> {
  if (inputs.length > MAX_ATTACHMENTS) throw new ActionError(`You can attach up to ${MAX_ATTACHMENTS} files.`);
  const prefix = `loads/${loadId}/chat/`;
  const allowed = new Set<string>(ALLOWED_UPLOAD_TYPES);
  const unique = [...new Map(inputs.map((a) => [a.key, a])).values()];
  for (const a of unique) {
    if (!a.key.startsWith(prefix) || a.key.includes("..") || !allowed.has(a.contentType)) throw new ActionError("That attachment can't be used here.");
  }
  const present = await Promise.all(unique.map((a) => objectExists(a.key)));
  if (present.some((ok) => !ok)) throw new ActionError("An attachment didn't finish uploading. Try attaching it again.");
  return unique.map((a) => ({ storageKey: a.key, name: a.name.slice(0, 200) || "Attachment", contentType: a.contentType, size: Math.max(0, Math.round(a.size)) }));
}

function preview(body: string, attachments: number) {
  const text = body.replace(/\s+/g, " ").trim();
  if (text) return text.length > 140 ? `${text.slice(0, 139)}…` : text;
  return attachments === 1 ? "Sent an attachment" : `Sent ${attachments} attachments`;
}

function runLater(task: () => Promise<unknown>) {
  const guarded = () => task().catch((error) => log.error("chat follow-up failed", { scope: "chat", err: error }));
  try {
    after(guarded);
  } catch {
    void guarded();
  }
}

async function recipientsFor(row: AccessRow, senderId: string) {
  const staff = await db
    .select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.organizationId, row.carrierOrgId), inArray(member.role, ["owner", "dispatcher"])));
  return [...new Set([row.shipperId, row.driverId, ...staff.map((s) => s.userId)])].filter((id): id is string => Boolean(id) && id !== senderId);
}

async function notifyRecipients(row: AccessRow, sender: { id: string; name: string }, text: string) {
  const recipients = await recipientsFor(row, sender.id);
  if (recipients.length === 0) return;
  const href = `/app/messages/${row.id}`;
  const now = Date.now();
  const emailKeys = recipients.map((id) => `chat-email:${row.id}:${id}`);
  const [pendingNotices, reads, emailed] = await Promise.all([
    db
      .select({ userId: notification.userId })
      .from(notification)
      .where(and(inArray(notification.userId, recipients), eq(notification.type, "message"), eq(notification.href, href), isNull(notification.readAt))),
    db
      .select({ userId: conversationRead.userId, lastReadAt: conversationRead.lastReadAt })
      .from(conversationRead)
      .where(and(eq(conversationRead.conversationId, row.id), inArray(conversationRead.userId, recipients))),
    db.select({ key: rateLimit.key, lastRequest: rateLimit.lastRequest }).from(rateLimit).where(inArray(rateLimit.key, emailKeys)),
  ]);
  const alreadyNoticed = new Set(pendingNotices.map((n) => n.userId));
  const lastRead = new Map(reads.map((r) => [r.userId, r.lastReadAt.getTime()]));
  const lastEmail = new Map(emailed.map((e) => [e.key, e.lastRequest]));
  const inApp = recipients.filter((id) => !alreadyNoticed.has(id));
  const viaEmail = inApp.filter((id) => now - (lastEmail.get(`chat-email:${row.id}:${id}`) ?? 0) > EMAIL_COOLDOWN_MS && now - (lastRead.get(id) ?? 0) > ACTIVE_READER_MS);
  const quiet = inApp.filter((id) => !viaEmail.includes(id));
  const notice = { type: "message", title: `${sender.name} · ${row.publicId}`, body: text, href };
  await Promise.all([
    notifyUsers(quiet, notice),
    notifyUsers(viaEmail, { ...notice, email: { subject: `New message about ${row.title}`, actionLabel: "Reply" } }),
    viaEmail.length
      ? db
          .insert(rateLimit)
          .values(viaEmail.map((id) => ({ id: randomUUID(), key: `chat-email:${row.id}:${id}`, count: 1, lastRequest: now })))
          .onConflictDoUpdate({ target: rateLimit.key, set: { lastRequest: now, count: sql`${rateLimit.count} + 1` } })
      : Promise.resolve(),
  ]);
}

export async function sendMessage(actor: ChatActor & { name: string }, conversationId: string, input: { body: string; attachments?: AttachmentInput[] }) {
  const { row, role } = await access(actor, conversationId);
  if (role === "admin") throw new ActionError("Admins can read this conversation but can't reply.");
  const body = maskProfanity(input.body.replace(/\r\n/g, "\n").trim());
  const files = input.attachments ?? [];
  if (!body && files.length === 0) throw new ActionError("Write a message first.");
  if (body.length > MESSAGE_MAX_LENGTH) throw new ActionError(`Messages can be up to ${MESSAGE_MAX_LENGTH.toLocaleString("en-US")} characters.`);
  if (!(await consumeRateLimit(`chat-send:${actor.userId}`, 30, 60))) throw new ActionError("You're sending messages too fast. Wait a moment and try again.");
  const attachments = await validateAttachments(row.loadId, files);
  const created = await db.transaction(async (tx) => {
    const [m] = await tx.insert(message).values({ conversationId: row.id, senderId: actor.userId, body, attachments }).returning();
    await tx.update(conversation).set({ lastMessageAt: m!.createdAt }).where(eq(conversation.id, row.id));
    await tx
      .insert(conversationRead)
      .values({ conversationId: row.id, userId: actor.userId, lastReadAt: m!.createdAt })
      .onConflictDoUpdate({ target: [conversationRead.conversationId, conversationRead.userId], set: { lastReadAt: m!.createdAt } });
    return m!;
  });
  await publish(topics.conversation(row.id), { event: "message", payload: { id: created.id, conversationId: row.id, senderId: actor.userId } });
  runLater(() => notifyRecipients(row, { id: actor.userId, name: actor.name }, preview(body, attachments.length)));
  const [dto] = await toMessages([{ ...created, senderName: actor.name }], row);
  return dto!;
}

export async function conversationForLoad(actor: ChatActor, loadId: string) {
  const rows = await db
    .select({ id: conversation.id, shipperId: conversation.shipperId, carrierOrgId: conversation.carrierOrgId, driverId: load.driverId })
    .from(conversation)
    .innerJoin(load, eq(load.id, conversation.loadId))
    .where(eq(conversation.loadId, loadId))
    .orderBy(desc(conversation.lastMessageAt));
  const match = rows.find((r) => {
    const role = roleFor(actor, r);
    return role && role !== "admin";
  });
  return match ?? (actor.isAdmin ? rows[0] : undefined) ?? null;
}

export function chatActorFromViewer(viewer: { user: { id: string; name: string; twoFactorEnabled?: boolean | null }; org: { orgId: string | null; role: string | null } | null; isAdmin: boolean }): ChatActor & { name: string } {
  const role = viewer.org?.role;
  return {
    userId: viewer.user.id,
    name: viewer.user.name,
    orgId: viewer.org?.orgId ?? null,
    orgRole: role === "owner" || role === "dispatcher" || role === "driver" ? role : null,
    isAdmin: viewer.isAdmin && Boolean(viewer.user.twoFactorEnabled),
  };
}
