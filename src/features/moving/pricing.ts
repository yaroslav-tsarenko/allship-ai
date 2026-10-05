export const bedroomVolumes = [300, 600, 950, 1300, 1650, 2000, 2300, 2600] as const;

export const packingLevels = {
  none: { label: "No packing", share: 0 },
  quarter: { label: "Quarter packing (25%)", share: 0.25 },
  half: { label: "Half packing (50%)", share: 0.5 },
  full: { label: "Full packing (100%)", share: 1 },
} as const;

export type PackingLevel = keyof typeof packingLevels;

export const LOCAL_MOVE_MAX_MILES = 150;
export const MAX_STORAGE_MONTHS = 24;

export type RateTier = { fromMiles: number; toMiles: number; ratePerCuFtCents: number };
export type ServiceRates = { packingPerCuFtCents: number; unpackingPerCuFtCents: number; storagePerCuFtMonthCents: number };

export type MoveRequest = {
  volumeCuFt: number;
  miles: number;
  packing: PackingLevel;
  unpacking: boolean;
  storageMonths: number;
};

export type QuoteLine = { key: "transport" | "packing" | "unpacking" | "storage"; label: string; detail: string; cents: number };

export type Quote = { tier: RateTier; lines: QuoteLine[]; carrierCents: number };

export function volumeForBedrooms(bedrooms: number) {
  const v = bedroomVolumes[bedrooms - 1];
  if (v === undefined) throw new RangeError(`Bedrooms must be 1–${bedroomVolumes.length}`);
  return v;
}

export function quoteMiles(miles: number) {
  return Math.max(0, Math.round(miles));
}

export function selectTier(tiers: readonly RateTier[], miles: number): RateTier | null {
  const m = quoteMiles(miles);
  return tiers.find((t) => t.fromMiles <= m && m <= t.toMiles && t.ratePerCuFtCents > 0) ?? null;
}

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const cuft = (n: number) => `${n.toLocaleString("en-US")} ft³`;

export function priceMove(tiers: readonly RateTier[], rates: ServiceRates | null, req: MoveRequest): Quote | null {
  const tier = selectTier(tiers, req.miles);
  if (!tier) return null;
  const lines: QuoteLine[] = [
    { key: "transport", label: "Transport", detail: `${cuft(req.volumeCuFt)} × ${usd(tier.ratePerCuFtCents)} per ft³`, cents: req.volumeCuFt * tier.ratePerCuFtCents },
  ];
  const share = packingLevels[req.packing].share;
  if (share > 0) {
    const rate = rates?.packingPerCuFtCents ?? 0;
    if (rate <= 0) return null;
    lines.push({ key: "packing", label: packingLevels[req.packing].label, detail: `${cuft(req.volumeCuFt)} × ${usd(rate)} × ${share * 100}%`, cents: Math.round(req.volumeCuFt * rate * share) });
  }
  if (req.unpacking) {
    const rate = rates?.unpackingPerCuFtCents ?? 0;
    if (rate <= 0) return null;
    lines.push({ key: "unpacking", label: "Unpacking", detail: `${cuft(req.volumeCuFt)} × ${usd(rate)}`, cents: req.volumeCuFt * rate });
  }
  if (req.storageMonths > 0) {
    const rate = rates?.storagePerCuFtMonthCents ?? 0;
    if (rate <= 0) return null;
    const months = Math.min(Math.floor(req.storageMonths), MAX_STORAGE_MONTHS);
    lines.push({ key: "storage", label: `Storage, ${months} ${months === 1 ? "month" : "months"}`, detail: `${cuft(req.volumeCuFt)} × ${usd(rate)} × ${months}`, cents: req.volumeCuFt * rate * months });
  }
  return { tier, lines, carrierCents: lines.reduce((s, l) => s + l.cents, 0) };
}

export type TierIssue = { index: number; message: string };

export function validateTiers(tiers: readonly RateTier[]): TierIssue[] {
  const issues: TierIssue[] = [];
  tiers.forEach((t, i) => {
    if (!Number.isInteger(t.fromMiles) || !Number.isInteger(t.toMiles) || t.fromMiles < 0) issues.push({ index: i, message: "Use whole miles, 0 or more" });
    else if (t.toMiles < t.fromMiles) issues.push({ index: i, message: "The end must be at or after the start" });
    if (!Number.isInteger(t.ratePerCuFtCents) || t.ratePerCuFtCents <= 0) issues.push({ index: i, message: "Enter a rate above $0" });
    const prev = tiers[i - 1];
    if (prev && t.fromMiles <= prev.toMiles) issues.push({ index: i, message: `Starts at or before the previous tier ends (${prev.toMiles} mi)` });
  });
  return issues;
}

export function tierGaps(tiers: readonly RateTier[], minMiles: number, maxMiles: number) {
  const gaps: Array<[number, number]> = [];
  let cursor = minMiles;
  for (const t of tiers) {
    if (t.toMiles < cursor) continue;
    if (t.fromMiles > cursor) gaps.push([cursor, Math.min(t.fromMiles - 1, maxMiles)]);
    cursor = Math.max(cursor, t.toMiles + 1);
    if (cursor > maxMiles) break;
  }
  if (cursor <= maxMiles) gaps.push([cursor, maxMiles]);
  return gaps.filter(([a, b]) => a <= b);
}

export function moveCategory(miles: number) {
  return miles < LOCAL_MOVE_MAX_MILES ? ("local_moving" as const) : ("long_distance_moving" as const);
}

export type MatchLabel = "lowest_price" | "top_rated";
export type Rankable = { name: string; shipperTotalCents: number; rating: number | null; reviewCount: number };

export function rankMatches<T extends Rankable>(items: readonly T[], limit = 6, topRatedMinReviews = 3): Array<T & { labels: MatchLabel[] }> {
  const out = [...items]
    .sort((a, b) => a.shipperTotalCents - b.shipperTotalCents || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((m) => ({ ...m, labels: [] as MatchLabel[] }));
  if (out.length < 2) return out;
  const low = out[0]!.shipperTotalCents;
  if (out.filter((m) => m.shipperTotalCents === low).length === 1) out[0]!.labels.push("lowest_price");
  const rated = out.filter((m) => m.rating !== null && m.reviewCount >= topRatedMinReviews);
  if (rated.length > 0) {
    const best = Math.max(...rated.map((m) => m.rating!));
    const top = rated.filter((m) => m.rating === best);
    if (top.length === 1) top[0]!.labels.push("top_rated");
  }
  return out;
}
