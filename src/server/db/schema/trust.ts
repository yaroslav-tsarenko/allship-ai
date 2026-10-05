import { check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createdAt, id } from "./_helpers";
import { organization, user } from "./auth";
import { disputeReasonEnum, disputeStatusEnum } from "./enums";
import { load } from "./loads";

export const review = pgTable(
  "review",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    shipperId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    carrierOrgId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    rating: integer().notNull(),
    body: text(),
    carrierReply: text(),
    carrierRepliedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("review_load_uq").on(t.loadId),
    index("review_carrier_idx").on(t.carrierOrgId),
    check("review_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);

export const dispute = pgTable(
  "dispute",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    openedBy: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    openedByRole: text().notNull(),
    reason: disputeReasonEnum().notNull(),
    details: text().notNull(),
    previousStatus: text().notNull(),
    status: disputeStatusEnum().notNull().default("open"),
    resolution: text(),
    refundCents: integer(),
    resolvedBy: text().references(() => user.id, { onDelete: "set null" }),
    resolvedAt: timestamp({ withTimezone: true }),
    evidence: jsonb().$type<string[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index("dispute_load_idx").on(t.loadId), index("dispute_status_idx").on(t.status, t.createdAt)],
);
