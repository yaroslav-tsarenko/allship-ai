import { zipRows, zipStateExceptions } from "./zip-index.generated";

type Prefix = { state: string; bits: bigint };

let index: Map<string, Prefix> | null = null;

function parse36(value: string) {
  let n = 0n;
  for (const ch of value) n = n * 36n + BigInt(parseInt(ch, 36));
  return n;
}

function prefixes() {
  if (index) return index;
  index = new Map();
  for (const row of zipRows.split("|")) index.set(row.slice(0, 3), { state: row.slice(3, 5), bits: parse36(row.slice(5)) });
  return index;
}

export function zipState(zip: string): string | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const p = prefixes().get(zip.slice(0, 3));
  if (!p || ((p.bits >> BigInt(Number(zip.slice(3)))) & 1n) === 0n) return null;
  return zipStateExceptions[zip] ?? p.state;
}
