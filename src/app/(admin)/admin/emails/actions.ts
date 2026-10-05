"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authedAction, ActionError } from "@/server/actions/safe-action";
import { assertAdmin, getActor } from "@/server/actor";
import { db } from "@/server/db/client";
import { auditLog } from "@/server/db/schema";
import { adminResumeEnrollment, adminStopEnrollment } from "@/server/nurture/admin";

export const setEnrollmentAction = authedAction
  .inputSchema(z.object({ id: z.string().uuid(), op: z.enum(["stop", "resume"]) }))
  .action(async ({ parsedInput, ctx }) => {
    const actor = await getActor(ctx.user.id);
    assertAdmin(actor);
    if (parsedInput.op === "stop") {
      if (!(await adminStopEnrollment(parsedInput.id))) throw new ActionError("This enrollment isn't active anymore.");
    } else {
      const result = await adminResumeEnrollment(parsedInput.id);
      if (!result.ok) throw new ActionError(result.reason);
    }
    await db.insert(auditLog).values({ actorId: actor.userId, action: `email_enrollment.${parsedInput.op}`, entity: "email_enrollment", entityId: parsedInput.id, diff: {} });
    revalidatePath("/admin/emails");
    return { ok: true };
  });
