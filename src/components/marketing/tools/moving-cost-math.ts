import { finite, interpolate, roundTo, type CurvePoint } from "./rate-curve";

export const homeSizes = [
  { value: "1", label: "Studio or 1 bedroom", cubicFeet: 300 },
  { value: "2", label: "2 bedrooms", cubicFeet: 600 },
  { value: "3", label: "3 bedrooms", cubicFeet: 950 },
  { value: "4", label: "4 bedrooms", cubicFeet: 1300 },
  { value: "5", label: "5 bedrooms", cubicFeet: 1650 },
  { value: "6", label: "6 bedrooms", cubicFeet: 2000 },
  { value: "7", label: "7 bedrooms", cubicFeet: 2300 },
  { value: "8", label: "8 or more bedrooms", cubicFeet: 2600 },
] as const;

export type HomeSize = (typeof homeSizes)[number]["value"];

export const packingLevels = [
  { value: "none", label: "None", share: 0 },
  { value: "fragile", label: "Fragile only", share: 0.25 },
  { value: "partial", label: "Partial", share: 0.5 },
  { value: "full", label: "Full", share: 1 },
] as const;

export type PackingLevel = (typeof packingLevels)[number]["value"];

export const movingAssumptions = {
  transportPerCubicFoot: [
    { miles: 0, low: 1.0, high: 1.8 },
    { miles: 50, low: 1.4, high: 2.4 },
    { miles: 250, low: 2.4, high: 4.0 },
    { miles: 1000, low: 3.6, high: 6.0 },
    { miles: 3000, low: 5.0, high: 8.5 },
  ] satisfies CurvePoint[],
  minimumTransport: { low: 350, high: 600 },
  packingPerCubicFoot: { low: 0.6, high: 1.2 },
  unpackingPerCubicFoot: { low: 0.25, high: 0.5 },
  storagePerCubicFootMonth: { low: 0.25, high: 0.45 },
  serviceFeeRate: 0.1,
  roundingStep: 10,
} as const;

export type MovingInput = {
  cubicFeet: number;
  miles: number;
  packing: PackingLevel;
  storageMonths: number;
  unpacking: boolean;
};

export type Range = { low: number; high: number };

export type MovingEstimate = {
  cubicFeet: number;
  transport: Range;
  packing: Range;
  unpacking: Range;
  storage: Range;
  carrierTotal: Range;
  serviceFee: Range;
  total: Range;
};

export const cubicFeetForHome = (size: HomeSize) => homeSizes.find((h) => h.value === size)?.cubicFeet ?? 0;

const scale = (r: Range, k: number): Range => ({ low: r.low * k, high: r.high * k });
const add = (...rs: Range[]): Range => rs.reduce((acc, r) => ({ low: acc.low + r.low, high: acc.high + r.high }), { low: 0, high: 0 });
const round = (r: Range, step: number): Range => ({ low: roundTo(r.low, step), high: roundTo(r.high, step) });

export function estimateMove(input: MovingInput, a = movingAssumptions): MovingEstimate {
  const cubicFeet = Math.max(0, finite(input.cubicFeet));
  const miles = Math.max(0, finite(input.miles));
  const months = Math.max(0, Math.floor(finite(input.storageMonths)));
  const share = packingLevels.find((p) => p.value === input.packing)?.share ?? 0;

  const rate = interpolate(a.transportPerCubicFoot, miles);
  const rawTransport = scale(rate, cubicFeet);
  const transport: Range = cubicFeet > 0 ? { low: Math.max(rawTransport.low, a.minimumTransport.low), high: Math.max(rawTransport.high, a.minimumTransport.high) } : { low: 0, high: 0 };
  const packing = scale(a.packingPerCubicFoot, cubicFeet * share);
  const unpacking = input.unpacking ? scale(a.unpackingPerCubicFoot, cubicFeet) : { low: 0, high: 0 };
  const storage = scale(a.storagePerCubicFootMonth, cubicFeet * months);

  const step = a.roundingStep;
  const carrierTotal = round(add(transport, packing, unpacking, storage), step);
  const serviceFee = round(scale(carrierTotal, a.serviceFeeRate), step);

  return {
    cubicFeet,
    transport: round(transport, step),
    packing: round(packing, step),
    unpacking: round(unpacking, step),
    storage: round(storage, step),
    carrierTotal,
    serviceFee,
    total: add(carrierTotal, serviceFee),
  };
}
