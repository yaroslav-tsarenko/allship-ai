import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cityData } from "../src/server/matcher/geo-data";
import { norm } from "../src/server/matcher/places";

const dir = join(process.cwd(), "public/data/zip");
const out = join(process.cwd(), "src/server/matcher/city-data.generated.ts");

type Acc = { city: string; state: string; lat: number; lng: number; n: number };
const all = new Map<string, Acc>();

for (const file of readdirSync(dir).filter((f) => /^\d{3}\.json$/.test(f))) {
  const table = JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, [string, string, number, number]>;
  for (const [city, state, lat, lng] of Object.values(table)) {
    const key = `${norm(city)}|${state}`;
    const acc = all.get(key) ?? { city, state, lat: 0, lng: 0, n: 0 };
    acc.lat += lat;
    acc.lng += lng;
    acc.n += 1;
    all.set(key, acc);
  }
}

const rows: string[] = [];
const seen = new Set<string>();
for (const row of cityData.split("|")) {
  const [city, state] = row.split(",");
  if (!city || !state) continue;
  const key = `${norm(city)}|${state}`;
  if (seen.has(key)) continue;
  seen.add(key);
  rows.push(row);
}
for (const [key, a] of [...all.entries()].sort((x, y) => y[1].n - x[1].n || x[1].city.localeCompare(y[1].city))) {
  if (seen.has(key)) continue;
  seen.add(key);
  rows.push(`${a.city},${a.state},${(a.lat / a.n).toFixed(3)},${(a.lng / a.n).toFixed(3)}`);
}

writeFileSync(out, `export const allCityData =\n  ${JSON.stringify(rows.join("|"))};\n`);
console.log(`${rows.length} cities, ${(readFileSync(out).length / 1024).toFixed(0)} KB`);
