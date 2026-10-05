import "server-only";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { requestLogger } from "@/lib/log";
import { getSession } from "@/server/auth/session";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  async handleServerError(error, utils) {
    if (error instanceof ActionError) return error.message;
    const logger = await requestLogger({ scope: "action" });
    logger.error("server action failed", { err: error, userId: (utils.ctx as { user?: { id?: string } }).user?.id });
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const authedAction = actionClient.use(async ({ next }) => {
  const session = await getSession();
  if (!session) throw new ActionError("Your session has expired. Sign in again.");
  if (session.user.banned) throw new ActionError("Your account is not available.");
  return next({ ctx: { session, user: session.user } });
});
