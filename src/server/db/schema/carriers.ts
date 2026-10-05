import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { organization } from "./auth";
import { fmcsaStatusEnum, loadCategoryEnum } from "./enums";

export const carrierProfile = pgTable(
  "carrier_profile",
  {
    orgId: text()
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    legalName: text().notNull(),
    dbaName: text(),
    usdotNumber: text(),
    mcNumber: text(),
    fmcsaStatus: fmcsaStatusEnum().notNull().default("unverified"),
    fmcsaCheckedAt: timestamp({ withTimezone: true }),
    fmcsaSnapshot: text(),
    insuranceExpiresAt: timestamp({ withTimezone: true }),
    insuranceDocKey: text(),
    serviceStates: text().array().notNull().default([]),
    instantQuotes: boolean().notNull().default(false),
    instantQuoteMinMiles: integer().notNull().default(0),
    instantQuoteMaxMiles: integer().notNull().default(3500),
    equipment: text().array().notNull().default([]),
    categories: loadCategoryEnum().array().notNull().default([]),
    about: text(),
    yearsInBusiness: integer(),
    website: text(),
    phone: text(),
    stripeAccountId: text(),
    chargesEnabled: boolean().notNull().default(false),
    payoutsEnabled: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("carrier_usdot_uq").on(t.usdotNumber),
    uniqueIndex("carrier_stripe_uq").on(t.stripeAccountId),
    index("carrier_fmcsa_idx").on(t.fmcsaStatus),
  ],
);

export const carrierRateTier = pgTable(
  "carrier_rate_tier",
  {
    id: id(),
    orgId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    fromMiles: integer().notNull(),
    toMiles: integer().notNull(),
    ratePerCuFtCents: integer().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("rate_tier_org_idx").on(t.orgId)],
);

export const carrierServiceRates = pgTable("carrier_service_rates", {
  orgId: text()
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  packingPerCuFtCents: integer().notNull().default(0),
  unpackingPerCuFtCents: integer().notNull().default(0),
  storagePerCuFtMonthCents: integer().notNull().default(0),
  updatedAt: updatedAt(),
});
