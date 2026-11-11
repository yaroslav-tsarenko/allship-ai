import { feeFor } from "./money";

const depositCategories = new Set(["local_moving", "long_distance_moving"]);

export const isDepositCategory = (category: string) => depositCategories.has(category);

export function bookingAmounts(category: string, bidCents: number, feeBps: number) {
  const split = feeFor(bidCents, feeBps);
  const deposit = isDepositCategory(category);
  return {
    deposit,
    carrierPriceCents: bidCents,
    feeCents: split.platformFeeCents,
    dueNowCents: deposit ? split.platformFeeCents : split.shipperTotalCents,
    escrowCarrierCents: deposit ? 0 : bidCents,
    onDeliveryCents: deposit ? bidCents : 0,
  };
}
