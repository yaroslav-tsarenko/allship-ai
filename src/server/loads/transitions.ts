import type { LoadStatus } from "@/server/db/schema/enums";

export type TransitionActor = "shipper" | "carrier" | "driver" | "system" | "admin";

export const transitions: Record<LoadStatus, Partial<Record<LoadStatus, TransitionActor[]>>> = {
  draft: { open: ["shipper"], cancelled: ["shipper"] },
  open: { awaiting_payment: ["shipper"], expired: ["system"], cancelled: ["shipper", "admin"] },
  awaiting_payment: { booked: ["system"], open: ["shipper", "system"], cancelled: ["shipper", "admin"] },
  booked: { assigned: ["carrier"], cancelled: ["admin", "shipper"], disputed: ["shipper", "carrier"] },
  assigned: { en_route_to_pickup: ["driver", "carrier"], booked: ["carrier"], cancelled: ["admin"], disputed: ["shipper", "carrier"] },
  en_route_to_pickup: { in_transit: ["driver", "carrier"], disputed: ["shipper", "carrier"] },
  in_transit: { delivered: ["driver", "carrier"], disputed: ["shipper", "carrier"] },
  delivered: { completed: ["shipper", "system"], disputed: ["shipper"] },
  completed: {},
  cancelled: {},
  expired: { open: ["shipper"] },
  disputed: { completed: ["admin"], cancelled: ["admin"] },
};

export function canTransition(from: LoadStatus, to: LoadStatus, actor: TransitionActor) {
  return transitions[from]?.[to]?.includes(actor) ?? false;
}

export const statusLabels: Record<LoadStatus, string> = {
  draft: "Draft",
  open: "Open for bids",
  awaiting_payment: "Awaiting payment",
  booked: "Booked",
  assigned: "Driver assigned",
  en_route_to_pickup: "On the way to pickup",
  in_transit: "In transit",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
  disputed: "In dispute",
};

export const activeShipperStatuses: LoadStatus[] = ["open", "awaiting_payment", "booked", "assigned", "en_route_to_pickup", "in_transit", "delivered", "disputed"];
