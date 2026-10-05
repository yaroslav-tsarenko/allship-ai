import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { organization, user } from "./auth";
import { bidStatusEnum, loadCategoryEnum, loadSourceEnum, loadStatusEnum, mediaKindEnum } from "./enums";

export type LoadStop = {
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  windowStart?: string;
  windowEnd?: string;
  floor?: number;
  hasElevator?: boolean;
  notes?: string;
};

export const load = pgTable(
  "load",
  {
    id: id(),
    publicId: text().notNull(),
    shipperId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    category: loadCategoryEnum().notNull(),
    title: text().notNull(),
    status: loadStatusEnum().notNull().default("draft"),
    pickup: jsonb().$type<LoadStop>().notNull(),
    dropoff: jsonb().$type<LoadStop>().notNull(),
    distanceMiles: numeric({ precision: 8, scale: 1, mode: "number" }),
    details: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    detailsVersion: integer().notNull().default(1),
    targetPriceCents: integer(),
    estimatedVolumeCuFt: integer(),
    publishedAt: timestamp({ withTimezone: true }),
    biddingClosesAt: timestamp({ withTimezone: true }),
    acceptedBidId: uuid(),
    carrierOrgId: text().references(() => organization.id, { onDelete: "set null" }),
    driverId: text().references(() => user.id, { onDelete: "set null" }),
    source: loadSourceEnum().notNull().default("dashboard"),
    publishOnVerify: boolean().notNull().default(false),
    biddingDays: integer().notNull().default(5),
    cancelledReason: text(),
    assignedAt: timestamp({ withTimezone: true }),
    pickedUpAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
    podRecipientName: text(),
    legacyId: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("load_public_id_uq").on(t.publicId),
    index("load_status_published_idx").on(t.status, t.publishedAt),
    index("load_shipper_status_idx").on(t.shipperId, t.status),
    index("load_carrier_status_idx").on(t.carrierOrgId, t.status),
    index("load_driver_idx").on(t.driverId),
    index("load_status_delivered_idx").on(t.status, t.deliveredAt),
  ],
);

export const loadMedia = pgTable(
  "load_media",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    kind: mediaKindEnum().notNull(),
    storageKey: text().notNull(),
    contentType: text(),
    uploadedBy: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("load_media_load_idx").on(t.loadId)],
);

export const loadEvent = pgTable(
  "load_event",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    type: text().notNull(),
    fromStatus: loadStatusEnum(),
    toStatus: loadStatusEnum(),
    actorId: text().references(() => user.id, { onDelete: "set null" }),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("load_event_load_idx").on(t.loadId, t.createdAt)],
);

export const bid = pgTable(
  "bid",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    carrierOrgId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdBy: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    amountCents: integer().notNull(),
    estimatedPickupAt: timestamp({ withTimezone: true }),
    estimatedDeliveryAt: timestamp({ withTimezone: true }),
    message: text().notNull(),
    status: bidStatusEnum().notNull().default("active"),
    aiAssisted: boolean().notNull().default(false),
    origin: text().$type<"manual" | "instant_quote" | "legacy">().notNull().default("manual"),
    legacyId: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("bid_load_idx").on(t.loadId, t.status),
    index("bid_carrier_idx").on(t.carrierOrgId, t.status),
    uniqueIndex("bid_active_per_carrier_uq").on(t.loadId, t.carrierOrgId).where(sql`${t.status} = 'active'`),
  ],
);

export const driverLocation = pgTable(
  "driver_location",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "cascade" }),
    driverId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lat: numeric({ precision: 9, scale: 6, mode: "number" }).notNull(),
    lng: numeric({ precision: 9, scale: 6, mode: "number" }).notNull(),
    accuracyM: integer(),
    headingDeg: integer(),
    speedMph: integer(),
    recordedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("driver_location_load_idx").on(t.loadId, t.recordedAt)],
);
