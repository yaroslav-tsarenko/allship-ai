import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "./_helpers";
import { user } from "./auth";
import { leadTypeEnum, postStatusEnum } from "./enums";

export const postCategory = pgTable(
  "post_category",
  {
    id: id(),
    slug: text().notNull(),
    name: text().notNull(),
    description: text(),
  },
  (t) => [uniqueIndex("post_category_slug_uq").on(t.slug)],
);

export const post = pgTable(
  "post",
  {
    id: id(),
    slug: text().notNull(),
    title: text().notNull(),
    excerpt: text().notNull(),
    body: jsonb().$type<{ markdown: string }>().notNull(),
    coverKey: text(),
    coverAlt: text(),
    categoryId: uuid().references(() => postCategory.id, { onDelete: "set null" }),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: postStatusEnum().notNull().default("draft"),
    publishedAt: timestamp({ withTimezone: true }),
    seoTitle: text(),
    seoDescription: text(),
    canonicalUrl: text(),
    faq: jsonb().$type<Array<{ question: string; answer: string }>>().notNull().default([]),
    readingMinutes: integer().notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("post_slug_uq").on(t.slug), index("post_status_published_idx").on(t.status, t.publishedAt)],
);

export const postTag = pgTable(
  "post_tag",
  {
    id: id(),
    slug: text().notNull(),
    name: text().notNull(),
  },
  (t) => [uniqueIndex("post_tag_slug_uq").on(t.slug)],
);

export const postToTag = pgTable(
  "post_to_tag",
  {
    postId: uuid()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => postTag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const lead = pgTable(
  "lead",
  {
    id: id(),
    type: leadTypeEnum().notNull(),
    name: text(),
    email: text(),
    phone: text(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    utm: jsonb().$type<Record<string, string>>().notNull().default({}),
    gclid: text(),
    status: text().notNull().default("new"),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("lead_type_created_idx").on(t.type, t.createdAt), index("lead_email_idx").on(t.email)],
);

export const newsletterSubscriber = pgTable(
  "newsletter_subscriber",
  {
    id: id(),
    email: text().notNull(),
    audience: text().notNull().default("shipper"),
    confirmedAt: timestamp({ withTimezone: true }),
    unsubscribedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)],
);

export const testimonial = pgTable(
  "testimonial",
  {
    id: id(),
    quote: text().notNull(),
    authorName: text().notNull(),
    authorDetail: text(),
    rating: integer(),
    sourceLabel: text().notNull(),
    sourceUrl: text(),
    reviewedAt: timestamp({ withTimezone: true }),
    audience: text().$type<"shipper" | "carrier" | "any">().notNull().default("any"),
    placements: text().array().notNull().default([]),
    published: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("testimonial_published_idx").on(t.published, t.sort)],
);

export const partnerLogo = pgTable(
  "partner_logo",
  {
    id: id(),
    name: text().notNull(),
    imageKey: text().notNull(),
    href: text(),
    relationship: text().notNull(),
    published: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("partner_logo_published_idx").on(t.published, t.sort)],
);

export const emailEnrollment = pgTable(
  "email_enrollment",
  {
    id: id(),
    sequence: text().notNull(),
    email: text().notNull(),
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    leadId: uuid().references(() => lead.id, { onDelete: "set null" }),
    loadId: uuid(),
    step: integer().notNull().default(0),
    status: text().$type<"active" | "completed" | "stopped" | "unsubscribed">().notNull().default("active"),
    nextSendAt: timestamp({ withTimezone: true }),
    lastSentAt: timestamp({ withTimezone: true }),
    stopReason: text(),
    context: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("email_enrollment_due_idx").on(t.status, t.nextSendAt),
    index("email_enrollment_email_idx").on(t.email, t.sequence),
    unique("email_enrollment_active_uq").on(t.email, t.sequence, t.loadId).nullsNotDistinct(),
  ],
);

export const emailSuppression = pgTable("email_suppression", {
  email: text().primaryKey(),
  reason: text().$type<"unsubscribed" | "bounced" | "complained">().notNull(),
  scope: text().$type<"marketing" | "all">().notNull().default("marketing"),
  createdAt: createdAt(),
});

export const emailSend = pgTable(
  "email_send",
  {
    id: id(),
    enrollmentId: uuid().references(() => emailEnrollment.id, { onDelete: "cascade" }),
    sequence: text().notNull(),
    step: integer().notNull(),
    email: text().notNull(),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    template: text().notNull(),
    subject: text().notNull(),
    category: text().$type<"transactional" | "lifecycle" | "marketing">().notNull(),
    status: text().$type<"sending" | "sent" | "skipped" | "failed">().notNull().default("sending"),
    error: text(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("email_send_step_uq").on(t.enrollmentId, t.step),
    index("email_send_email_created_idx").on(t.email, t.createdAt),
    index("email_send_created_idx").on(t.createdAt),
  ],
);

export const emailOptOut = pgTable(
  "email_opt_out",
  {
    email: text().notNull(),
    sequence: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.email, t.sequence] })],
);
