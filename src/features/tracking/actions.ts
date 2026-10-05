"use server";

import { z } from "zod";
import { getActor } from "@/server/actor";
import { authedAction } from "@/server/actions/safe-action";
import { trackingFor } from "@/server/trips/service";

export const trackingPointsAction = authedAction.inputSchema(z.object({ loadId: z.uuid() })).action(async ({ parsedInput, ctx }) => {
  const actor = await getActor(ctx.user.id);
  const { load, points } = await trackingFor(actor, parsedInput.loadId);
  return {
    status: load.status,
    points: points.map((p) => ({ lat: p.lat, lng: p.lng, recordedAt: p.recordedAt.toISOString(), speedMph: p.speedMph, headingDeg: p.headingDeg, accuracyM: p.accuracyM })),
  };
});
