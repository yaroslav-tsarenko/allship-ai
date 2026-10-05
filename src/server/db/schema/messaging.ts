import { boolean, index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { organization, user } from "./auth";
import { conversationKindEnum, notificationChannelEnum } from "./enums";
import { load } from "./loads";

export type MessageAttachment = { storageKey: string; name: string; contentType: string; size: number };

export const conversation = pgTable(
  "conversation",
  {
    id: id(),
    kind: conversationKindEnum().notNull(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    shipperId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    carrierOrgId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("conversation_load_carrier_uq").on(t.loadId, t.carrierOrgId),
    index("conversation_shipper_idx").on(t.shipperId),
    index("conversation_carrier_idx").on(t.carrierOrgId),
  ],
);

export const message = pgTable(
  "message",
  {
    id: id(),
    conversationId: uuid()
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text().notNull(),
    attachments: jsonb().$type<MessageAttachment[]>().notNull().default([]),
    editedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("message_conversation_idx").on(t.conversationId, t.createdAt)],
);

export const conversationRead = pgTable(
  "conversation_read",
  {
    conversationId: uuid()
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
);

export const notification = pgTable(
  "notification",
  {
    id: id(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text().notNull(),
    title: text().notNull(),
    body: text(),
    href: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notification_user_idx").on(t.userId, t.readAt, t.createdAt)],
);

export const notificationPreference = pgTable(
  "notification_preference",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum().notNull(),
    type: text().notNull(),
    enabled: boolean().notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.userId, t.channel, t.type] })],
);
