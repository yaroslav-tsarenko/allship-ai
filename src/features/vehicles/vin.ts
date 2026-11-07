const values: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(raw: string) {
  return raw.toUpperCase().replace(/[\s-]/g, "");
}

function charValue(ch: string) {
  return /\d/.test(ch) ? Number(ch) : values[ch];
}

export function vinCheckDigit(vin: string) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = charValue(vin[i]!);
    if (v === undefined) return null;
    sum += v * weights[i]!;
  }
  const r = sum % 11;
  return r === 10 ? "X" : String(r);
}

export function vinIssue(raw: string): string | null {
  const vin = normalizeVin(raw);
  if (!vin) return null;
  if (/[IOQ]/.test(vin)) return "VINs never use the letters I, O or Q. Check for 1 and 0.";
  if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) return "Use only letters and numbers";
  if (vin.length !== 17) return `A VIN has 17 characters. This one has ${vin.length}.`;
  if (vinCheckDigit(vin) !== vin[8]) return "This VIN doesn't pass the check digit test. Check each character.";
  return null;
}

export function isValidVin(raw: string) {
  const vin = normalizeVin(raw);
  return vin.length === 17 && vinIssue(vin) === null;
}
