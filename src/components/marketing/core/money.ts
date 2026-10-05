import { site } from "@/content/site";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export const formatUsd = (cents: number) => usd.format(cents / 100);
export const formatUsdWhole = (dollars: number) => usdWhole.format(dollars);

export function feeBreakdown(bidCents: number) {
  const fee = Math.round((bidCents * site.platformFeePercent) / 100);
  return { bid: bidCents, fee, total: bidCents + fee };
}
