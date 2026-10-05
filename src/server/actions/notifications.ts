"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActor } from "@/server/actor";
import { unreadConversationCount } from "@/server/chat/service";
import { emailGroups, listNotifications, markAllNotificationsRead, markNotificationsRead, setEmailPreference, unreadNotificationCount } from "@/server/notifications/queries";
import { authedAction } from "./safe-action";

const groupKeys = emailGroups.map((g) => g.key) as [string, ...string[]];

export const listNotificationsAction = authedAction
  .inputSchema(z.object({ before: z.uuid().optional(), unreadOnly: z.boolean().default(false), limit: z.number().int().min(1).max(100).optional() }))
  .action(async ({ parsedInput, ctx }) => listNotifications(ctx.user.id, parsedInput));

export const shellCountsAction = authedAction.action(async ({ ctx }) => {
  const actor = await getActor(ctx.user.id);
  const [notifications, conversations] = await Promise.all([unreadNotificationCount(actor.userId), unreadConversationCount(actor)]);
  return { notifications, conversations };
});

export const markNotificationsReadAction = authedAction.inputSchema(z.object({ ids: z.array(z.uuid()).min(1).max(100) })).action(async ({ parsedInput, ctx }) => {
  await markNotificationsRead(ctx.user.id, parsedInput.ids);
  return { ok: true };
});

export const markAllNotificationsReadAction = authedAction.action(async ({ ctx }) => {
  await markAllNotificationsRead(ctx.user.id);
  revalidatePath("/app/notifications");
  return { ok: true };
});

export const setEmailPreferenceAction = authedAction.inputSchema(z.object({ group: z.enum(groupKeys), enabled: z.boolean() })).action(async ({ parsedInput, ctx }) => {
  await setEmailPreference(ctx.user.id, parsedInput.group as (typeof emailGroups)[number]["key"], parsedInput.enabled);
  return { ok: true };
});
