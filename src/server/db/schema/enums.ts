import { pgEnum } from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type", ["shipper", "carrier"]);

export const loadCategories = [
  "car_or_light_truck",
  "motorcycle",
  "powerboat",
  "sailboat",
  "personal_watercraft",
  "atv_powersports",
  "commercial_truck",
  "vehicle_parts",
  "trailer",
  "rv",
  "local_moving",
  "long_distance_moving",
  "household_items",
  "office_moving",
  "business_moving",
  "corporate_relocation",
  "student_moving",
  "military_moving",
  "heavy_lifting",
  "freight",
  "heavy_equipment",
  "truck_rental",
  "truck_with_driver",
] as const;
export type LoadCategory = (typeof loadCategories)[number];
export const loadCategoryEnum = pgEnum("load_category", loadCategories);

export const loadStatuses = [
  "draft",
  "open",
  "awaiting_payment",
  "booked",
  "assigned",
  "en_route_to_pickup",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
  "expired",
  "disputed",
] as const;
export type LoadStatus = (typeof loadStatuses)[number];
export const loadStatusEnum = pgEnum("load_status", loadStatuses);

export const loadSourceEnum = pgEnum("load_source", ["dashboard", "landing_quote", "assistant", "legacy"]);

export const bidStatusEnum = pgEnum("bid_status", ["active", "withdrawn", "accepted", "declined", "expired"]);

export const fmcsaStatusEnum = pgEnum("fmcsa_status", ["unverified", "pending", "verified", "failed", "manual_review"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "requires_payment",
  "processing",
  "succeeded",
  "refunded",
  "partially_refunded",
  "disputed",
  "failed",
  "canceled",
]);

export const payoutStatusEnum = pgEnum("payout_status", ["pending", "scheduled", "paid", "reversed", "held"]);

export const ledgerAccountEnum = pgEnum("ledger_account", [
  "shipper_cash",
  "escrow",
  "platform_revenue",
  "carrier_payable",
  "carrier_paid",
  "refunds",
]);

export const mediaKindEnum = pgEnum("media_kind", ["photo", "document", "pod_photo", "pod_signature", "pickup_photo"]);

export const conversationKindEnum = pgEnum("conversation_kind", ["inquiry", "booking"]);

export const postStatusEnum = pgEnum("post_status", ["draft", "scheduled", "published", "archived"]);

export const leadTypeEnum = pgEnum("lead_type", ["contact", "quote", "carrier", "partner", "newsletter"]);

export const notificationChannelEnum = pgEnum("notification_channel", ["in_app", "email"]);

export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant", "system"]);

export const disputeStatusEnum = pgEnum("dispute_status", ["open", "resolved_release", "resolved_refund", "resolved_split", "withdrawn"]);

export const disputeReasonEnum = pgEnum("dispute_reason", ["damage", "not_delivered", "late", "missing_items", "overcharge", "no_show", "other"]);
