import { erase } from "../define";
import type { AnyScene, SceneId } from "../types";
import { adaptive } from "./adaptive";
import { aiAssistant } from "./ai-assistant";
import { aiDraftBid } from "./ai-draft-bid";
import { aiDraftLoad } from "./ai-draft-load";
import { bidsCompare } from "./bids-compare";
import { carrierBoard } from "./carrier-board";
import { chat } from "./chat";
import { driverTrip } from "./driver-trip";
import { escrowFlow } from "./escrow-flow";
import { fleet } from "./fleet";
import { guidedTour } from "./guided-tour";
import { instantQuote } from "./instant-quote";
import { liveTracking } from "./live-tracking";
import { postLoad } from "./post-load";
import { rateCard } from "./rate-card";

export const scenes: Record<SceneId, AnyScene> = {
  postLoad: erase(postLoad),
  bidsCompare: erase(bidsCompare),
  aiAssistant: erase(aiAssistant),
  carrierBoard: erase(carrierBoard),
  instantQuote: erase(instantQuote),
  liveTracking: erase(liveTracking),
  driverTrip: erase(driverTrip),
  fleet: erase(fleet),
  chat: erase(chat),
  escrowFlow: erase(escrowFlow),
  adaptive: erase(adaptive),
  rateCard: erase(rateCard),
  aiDraftLoad: erase(aiDraftLoad),
  aiDraftBid: erase(aiDraftBid),
  guidedTour: erase(guidedTour),
};

export const sceneIds = Object.keys(scenes) as SceneId[];

export {
  adaptive,
  aiAssistant,
  aiDraftBid,
  aiDraftLoad,
  bidsCompare,
  carrierBoard,
  chat,
  driverTrip,
  escrowFlow,
  fleet,
  guidedTour,
  instantQuote,
  liveTracking,
  postLoad,
  rateCard,
};
