import { finite, interpolate, roundTo, type CurvePoint } from "./rate-curve";

export const vehicleSizes = [
  { value: "sedan", label: "Sedan", multiplier: 1 },
  { value: "suv", label: "SUV", multiplier: 1.15 },
  { value: "pickup", label: "Pickup", multiplier: 1.25 },
  { value: "oversized", label: "Oversized", multiplier: 1.5 },
] as const;

export type VehicleSize = (typeof vehicleSizes)[number]["value"];
export type TrailerType = "open" | "enclosed";
export type Condition = "running" | "inoperable";

export const carAssumptions = {
  baseByDistance: [
    { miles: 0, low: 250, high: 450 },
    { miles: 100, low: 350, high: 600 },
    { miles: 500, low: 600, high: 950 },
    { miles: 1000, low: 800, high: 1250 },
    { miles: 2000, low: 1100, high: 1700 },
    { miles: 3000, low: 1400, high: 2100 },
  ] satisfies CurvePoint[],
  enclosedMultiplier: { low: 1.4, high: 1.7 },
  inoperableSurcharge: { low: 150, high: 250 },
  serviceFeeRate: 0.1,
  roundingStep: 10,
} as const;

export type CarInput = { miles: number; size: VehicleSize; trailer: TrailerType; condition: Condition };
export type Range = { low: number; high: number };
export type CarEstimate = { base: Range; carrierTotal: Range; serviceFee: Range; total: Range; perMile: Range | null };

export function estimateCarShipping(input: CarInput, a = carAssumptions): CarEstimate {
  const miles = Math.max(0, finite(input.miles));
  const size = vehicleSizes.find((v) => v.value === input.size)?.multiplier ?? 1;
  const base = interpolate(a.baseByDistance, miles);
  let low = base.low * size;
  let high = base.high * size;
  if (input.trailer === "enclosed") {
    low *= a.enclosedMultiplier.low;
    high *= a.enclosedMultiplier.high;
  }
  if (input.condition === "inoperable") {
    low += a.inoperableSurcharge.low;
    high += a.inoperableSurcharge.high;
  }
  const step = a.roundingStep;
  const carrierTotal = { low: roundTo(low, step), high: roundTo(high, step) };
  const serviceFee = { low: roundTo(carrierTotal.low * a.serviceFeeRate, step), high: roundTo(carrierTotal.high * a.serviceFeeRate, step) };
  return {
    base: { low: roundTo(base.low, step), high: roundTo(base.high, step) },
    carrierTotal,
    serviceFee,
    total: { low: carrierTotal.low + serviceFee.low, high: carrierTotal.high + serviceFee.high },
    perMile: miles > 0 ? { low: carrierTotal.low / miles, high: carrierTotal.high / miles } : null,
  };
}
