import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "public/data/zip");
const out = join(process.cwd(), "src/server/geo/zip-index.generated.ts");

const rows: string[] = [];
const exceptions: Record<string, string> = {};

for (const file of readdirSync(dir).filter((f) => /^\d{3}\.json$/.test(f)).sort()) {
  const prefix = file.slice(0, 3);
  const table = JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, [string, string, number, number]>;
  const counts = new Map<string, number>();
  for (const [, state] of Object.values(table)) counts.set(state, (counts.get(state) ?? 0) + 1);
  const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  let bits = 0n;
  for (const [zip, [, state]] of Object.entries(table)) {
    bits |= 1n << BigInt(Number(zip.slice(3)));
    if (state !== main) exceptions[zip] = state;
  }
  rows.push(`${prefix}${main}${bits.toString(36)}`);
}

writeFileSync(
  out,
  `export const zipRows = ${JSON.stringify(rows.join("|"))};\n\nexport const zipStateExceptions: Record<string, string> = ${JSON.stringify(exceptions)};\n`,
);
console.log(`${rows.length} prefixes, ${Object.keys(exceptions).length} exceptions, ${(readFileSync(out).length / 1024).toFixed(1)} KB`);
