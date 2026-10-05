export function toCents(dollars: number) {
  return Math.round(dollars * 100);
}

export function feeFor(carrierAmountCents: number, feeBps: number) {
  const platformFeeCents = Math.round((carrierAmountCents * feeBps) / 10_000);
  return { carrierAmountCents, platformFeeCents, shipperTotalCents: carrierAmountCents + platformFeeCents };
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatUsd(cents: number, whole = false) {
  return (whole && cents % 100 === 0 ? usdWhole : usd).format(cents / 100);
}
