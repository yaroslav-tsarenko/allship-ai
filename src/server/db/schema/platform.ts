import { index, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { createdAt, id } from "./_helpers";
import { user } from "./auth";

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    actorId: text().references(() => user.id, { onDelete: "set null" }),
    action: text().notNull(),
    entity: text().notNull(),
    entityId: text(),
    diff: jsonb().$type<Record<string, unknown>>(),
    ip: text(),
    userAgent: text(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId), index("audit_actor_idx").on(t.actorId, t.createdAt)],
);

export const legacyMap = pgTable(
  "legacy_map",
  {
    collection: text().notNull(),
    mongoId: text().notNull(),
    newId: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.collection, t.mongoId] })],
);

export const tourProgress = pgTable(
  "tour_progress",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tourId: text().notNull(),
    completedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tourId] })],
);
