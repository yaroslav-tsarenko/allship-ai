"use server";

import { z } from "zod";
import { getActor } from "@/server/actor";
import { MESSAGE_MAX_LENGTH, MAX_ATTACHMENTS, getConversation, listConversations, markRead, messagesAfter, sendMessage, unreadConversationCount } from "@/server/chat/service";
import { markConversationNotificationsRead } from "@/server/notifications/queries";
import { MAX_UPLOAD_BYTES } from "@/server/storage/storage";
import { authedAction } from "./safe-action";

const withActor = authedAction.use(async ({ next, ctx }) => next({ ctx: { ...ctx, actor: await getActor(ctx.user.id) } }));

const conversationRef = z.object({ conversationId: z.uuid() });

export const listConversationsAction = withActor.action(async ({ ctx }) => listConversations(ctx.actor));

export const olderMessagesAction = withActor
  .inputSchema(z.object({ conversationId: z.uuid(), before: z.uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { messages, hasMore } = await getConversation(ctx.actor, parsedInput.conversationId, { before: parsedInput.before });
    return { messages, hasMore };
  });

export const newMessagesAction = withActor
  .inputSchema(z.object({ conversationId: z.uuid(), after: z.uuid().nullable() }))
  .action(async ({ parsedInput, ctx }) => messagesAfter(ctx.actor, parsedInput.conversationId, parsedInput.after));

export const sendMessageAction = withActor
  .inputSchema(
    z.object({
      conversationId: z.uuid(),
      body: z.string().max(MESSAGE_MAX_LENGTH + 200),
      attachments: z
        .array(z.object({ key: z.string().min(1).max(300), name: z.string().max(300), contentType: z.string().max(100), size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES) }))
        .max(MAX_ATTACHMENTS)
        .default([]),
    }),
  )
  .action(async ({ parsedInput, ctx }) => sendMessage(ctx.actor, parsedInput.conversationId, parsedInput));

export const markConversationReadAction = withActor.inputSchema(conversationRef).action(async ({ parsedInput, ctx }) => {
  await markRead(ctx.actor, parsedInput.conversationId);
  await markConversationNotificationsRead(ctx.actor.userId, parsedInput.conversationId);
  return { ok: true };
});

export const unreadConversationsAction = withActor.action(async ({ ctx }) => unreadConversationCount(ctx.actor));
