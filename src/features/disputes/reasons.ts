export type DisputeReasonValue = "damage" | "not_delivered" | "late" | "missing_items" | "overcharge" | "no_show" | "other";

export const disputeReasonLabels: Record<DisputeReasonValue, string> = {
  damage: "Shipment was damaged",
  not_delivered: "Shipment wasn't delivered",
  late: "Pickup or delivery was late",
  missing_items: "Items are missing",
  overcharge: "Charged more than agreed",
  no_show: "No-show at pickup or delivery",
  other: "Something else",
};

export const reasonsByRole: Record<"shipper" | "carrier", DisputeReasonValue[]> = {
  shipper: ["damage", "missing_items", "not_delivered", "late", "no_show", "overcharge", "other"],
  carrier: ["no_show", "late", "overcharge", "other"],
};

export const disputeStatusLabels: Record<string, string> = {
  open: "Under review",
  resolved_release: "Resolved: paid to carrier",
  resolved_refund: "Resolved: refunded in full",
  resolved_split: "Resolved: split",
  withdrawn: "Withdrawn",
};
