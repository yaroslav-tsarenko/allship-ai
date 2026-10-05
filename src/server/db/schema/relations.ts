import { relations } from "drizzle-orm";
import { account, member, organization, passkey, session, twoFactor, user } from "./auth";
import { carrierProfile, carrierRateTier, carrierServiceRates } from "./carriers";
import { bid, driverLocation, load, loadEvent, loadMedia } from "./loads";
import { conversation, message } from "./messaging";
import { payment, payout } from "./money";
import { review } from "./trust";
import { aiMessage, aiThread } from "./ai";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  passkeys: many(passkey),
  twoFactors: many(twoFactor),
  memberships: many(member),
  loads: many(load, { relationName: "shipperLoads" }),
  aiThreads: many(aiThread),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
  user: one(user, { fields: [passkey.userId], references: [user.id] }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, { fields: [twoFactor.userId], references: [user.id] }),
}));

export const organizationRelations = relations(organization, ({ many, one }) => ({
  members: many(member),
  carrierProfile: one(carrierProfile, { fields: [organization.id], references: [carrierProfile.orgId] }),
  rateTiers: many(carrierRateTier),
  serviceRates: one(carrierServiceRates, { fields: [organization.id], references: [carrierServiceRates.orgId] }),
  bids: many(bid),
  reviews: many(review),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, { fields: [member.organizationId], references: [organization.id] }),
  user: one(user, { fields: [member.userId], references: [user.id] }),
}));

export const carrierProfileRelations = relations(carrierProfile, ({ one }) => ({
  organization: one(organization, { fields: [carrierProfile.orgId], references: [organization.id] }),
}));

export const carrierRateTierRelations = relations(carrierRateTier, ({ one }) => ({
  organization: one(organization, { fields: [carrierRateTier.orgId], references: [organization.id] }),
}));

export const loadRelations = relations(load, ({ one, many }) => ({
  shipper: one(user, { fields: [load.shipperId], references: [user.id], relationName: "shipperLoads" }),
  carrier: one(organization, { fields: [load.carrierOrgId], references: [organization.id] }),
  driver: one(user, { fields: [load.driverId], references: [user.id] }),
  bids: many(bid),
  media: many(loadMedia),
  events: many(loadEvent),
  locations: many(driverLocation),
  payments: many(payment),
  payout: one(payout, { fields: [load.id], references: [payout.loadId] }),
  conversations: many(conversation),
  review: one(review, { fields: [load.id], references: [review.loadId] }),
}));

export const bidRelations = relations(bid, ({ one }) => ({
  load: one(load, { fields: [bid.loadId], references: [load.id] }),
  carrier: one(organization, { fields: [bid.carrierOrgId], references: [organization.id] }),
  author: one(user, { fields: [bid.createdBy], references: [user.id] }),
}));

export const loadMediaRelations = relations(loadMedia, ({ one }) => ({
  load: one(load, { fields: [loadMedia.loadId], references: [load.id] }),
}));

export const loadEventRelations = relations(loadEvent, ({ one }) => ({
  load: one(load, { fields: [loadEvent.loadId], references: [load.id] }),
  actor: one(user, { fields: [loadEvent.actorId], references: [user.id] }),
}));

export const driverLocationRelations = relations(driverLocation, ({ one }) => ({
  load: one(load, { fields: [driverLocation.loadId], references: [load.id] }),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  load: one(load, { fields: [payment.loadId], references: [load.id] }),
  bid: one(bid, { fields: [payment.bidId], references: [bid.id] }),
}));

export const payoutRelations = relations(payout, ({ one }) => ({
  load: one(load, { fields: [payout.loadId], references: [load.id] }),
  payment: one(payment, { fields: [payout.paymentId], references: [payment.id] }),
}));

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  load: one(load, { fields: [conversation.loadId], references: [load.id] }),
  carrier: one(organization, { fields: [conversation.carrierOrgId], references: [organization.id] }),
  shipper: one(user, { fields: [conversation.shipperId], references: [user.id] }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, { fields: [message.conversationId], references: [conversation.id] }),
  sender: one(user, { fields: [message.senderId], references: [user.id] }),
}));

export const reviewRelations = relations(review, ({ one }) => ({
  load: one(load, { fields: [review.loadId], references: [load.id] }),
  carrier: one(organization, { fields: [review.carrierOrgId], references: [organization.id] }),
}));

export const aiThreadRelations = relations(aiThread, ({ one, many }) => ({
  user: one(user, { fields: [aiThread.userId], references: [user.id] }),
  messages: many(aiMessage),
}));

export const aiMessageRelations = relations(aiMessage, ({ one }) => ({
  thread: one(aiThread, { fields: [aiMessage.threadId], references: [aiThread.id] }),
}));
