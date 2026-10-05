import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid, char } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { organization, user } from "./auth";
import { ledgerAccountEnum, paymentStatusEnum, payoutStatusEnum } from "./enums";
import { bid, load } from "./loads";

export const payment = pgTable(
  "payment",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "restrict" }),
    bidId: uuid()
      .notNull()
      .references(() => bid.id, { onDelete: "restrict" }),
    shipperId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    stripePaymentIntentId: text(),
    stripeChargeId: text(),
    currency: char({ length: 3 }).notNull().default("usd"),
    amountCents: integer().notNull(),
    carrierAmountCents: integer().notNull(),
    platformFeeCents: integer().notNull(),
    refundedCents: integer().notNull().default(0),
    status: paymentStatusEnum().notNull().default("requires_payment"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payment_pi_uq").on(t.stripePaymentIntentId),
    index("payment_load_idx").on(t.loadId),
    index("payment_shipper_idx").on(t.shipperId),
  ],
);

export const payout = pgTable(
  "payout",
  {
    id: id(),
    loadId: uuid()
      .notNull()
      .references(() => load.id, { onDelete: "restrict" }),
    paymentId: uuid()
      .notNull()
      .references(() => payment.id, { onDelete: "restrict" }),
    carrierOrgId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    stripeTransferId: text(),
    currency: char({ length: 3 }).notNull().default("usd"),
    amountCents: integer().notNull(),
    status: payoutStatusEnum().notNull().default("pending"),
    releaseAfter: timestamp({ withTimezone: true }),
    paidAt: timestamp({ withTimezone: true }),
    failureReason: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("payout_transfer_uq").on(t.stripeTransferId),
    uniqueIndex("payout_load_uq").on(t.loadId),
    index("payout_carrier_idx").on(t.carrierOrgId, t.status),
  ],
);

export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: id(),
    journalId: uuid().notNull(),
    account: ledgerAccountEnum().notNull(),
    amountCents: integer().notNull(),
    currency: char({ length: 3 }).notNull().default("usd"),
    refType: text().notNull(),
    refId: text().notNull(),
    memo: text(),
    createdAt: createdAt(),
  },
  (t) => [index("ledger_journal_idx").on(t.journalId), index("ledger_ref_idx").on(t.refType, t.refId)],
);

export const stripeEvent = pgTable("stripe_event", {
  id: text().primaryKey(),
  type: text().notNull(),
  processedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
