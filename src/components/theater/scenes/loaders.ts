import { erase } from "../define";
import type { AnyScene, SceneId } from "../types";

export const sceneLoaders: Record<SceneId, () => Promise<AnyScene>> = {
  postLoad: () => import("./post-load").then((m) => erase(m.postLoad)),
  bidsCompare: () => import("./bids-compare").then((m) => erase(m.bidsCompare)),
  aiAssistant: () => import("./ai-assistant").then((m) => erase(m.aiAssistant)),
  carrierBoard: () => import("./carrier-board").then((m) => erase(m.carrierBoard)),
  instantQuote: () => import("./instant-quote").then((m) => erase(m.instantQuote)),
  liveTracking: () => import("./live-tracking").then((m) => erase(m.liveTracking)),
  driverTrip: () => import("./driver-trip").then((m) => erase(m.driverTrip)),
  fleet: () => import("./fleet").then((m) => erase(m.fleet)),
  chat: () => import("./chat").then((m) => erase(m.chat)),
  escrowFlow: () => import("./escrow-flow").then((m) => erase(m.escrowFlow)),
  adaptive: () => import("./adaptive").then((m) => erase(m.adaptive)),
  rateCard: () => import("./rate-card").then((m) => erase(m.rateCard)),
  aiDraftLoad: () => import("./ai-draft-load").then((m) => erase(m.aiDraftLoad)),
  aiDraftBid: () => import("./ai-draft-bid").then((m) => erase(m.aiDraftBid)),
  guidedTour: () => import("./guided-tour").then((m) => erase(m.guidedTour)),
};
