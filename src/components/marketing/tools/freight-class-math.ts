export const densityScale = [
  { min: 50, freightClass: "50" },
  { min: 35, freightClass: "55" },
  { min: 30, freightClass: "60" },
  { min: 22.5, freightClass: "65" },
  { min: 15, freightClass: "70" },
  { min: 12, freightClass: "85" },
  { min: 10, freightClass: "92.5" },
  { min: 8, freightClass: "100" },
  { min: 6, freightClass: "125" },
  { min: 4, freightClass: "175" },
  { min: 2, freightClass: "250" },
  { min: 1, freightClass: "300" },
  { min: 0, freightClass: "400" },
] as const;

export type FreightClass = (typeof densityScale)[number]["freightClass"];

export type FreightInput = { lengthIn: number; widthIn: number; heightIn: number; weightLb: number; pieces: number };

export type FreightResult = {
  cubicFeetPerPiece: number;
  totalCubicFeet: number;
  totalWeight: number;
  density: number;
  freightClass: FreightClass;
};

const CUBIC_INCHES_PER_CUBIC_FOOT = 1728;

export function classForDensity(density: number): FreightClass {
  for (const row of densityScale) {
    if (density >= row.min) return row.freightClass;
  }
  return "400";
}

export function densityRangeLabel(freightClass: FreightClass) {
  const i = densityScale.findIndex((r) => r.freightClass === freightClass);
  const min = densityScale[i]?.min ?? 0;
  const upper = densityScale[i - 1]?.min ?? null;
  if (upper === null) return `${min} lb/ft³ or more`;
  if (min === 0) return `Less than ${upper} lb/ft³`;
  return `${min} to under ${upper} lb/ft³`;
}

export function calculateFreightClass(input: FreightInput): FreightResult | null {
  const { lengthIn, widthIn, heightIn, weightLb } = input;
  const pieces = Math.floor(input.pieces);
  if (![lengthIn, widthIn, heightIn, weightLb].every((v) => Number.isFinite(v) && v > 0) || !Number.isFinite(pieces) || pieces < 1) return null;
  const cubicFeetPerPiece = (lengthIn * widthIn * heightIn) / CUBIC_INCHES_PER_CUBIC_FOOT;
  const totalCubicFeet = cubicFeetPerPiece * pieces;
  const totalWeight = weightLb * pieces;
  const density = totalWeight / totalCubicFeet;
  return { cubicFeetPerPiece, totalCubicFeet, totalWeight, density, freightClass: classForDensity(density) };
}
