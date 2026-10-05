import { loadCategories, type LoadCategory } from "@/server/db/schema/enums";
import { US_STATES } from "@/features/loads/schema";

export const boardSorts = [
  { value: "newest", label: "Newest" },
  { value: "pickup", label: "Pickup soonest" },
  { value: "target", label: "Highest target" },
] as const;

export type BoardSort = (typeof boardSorts)[number]["value"];

export type BoardFilters = { categories: LoadCategory[]; from: string | null; to: string | null; sort: BoardSort };

const stateCodes = new Set<string>(US_STATES.map(([code]) => code));
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseBoardFilters(params: Record<string, string | string[] | undefined>): BoardFilters {
  const rawCats = first(params.cat)?.split(",") ?? [];
  const categories = rawCats.filter((c): c is LoadCategory => (loadCategories as readonly string[]).includes(c));
  const from = first(params.from)?.toUpperCase() ?? "";
  const to = first(params.to)?.toUpperCase() ?? "";
  const sort = boardSorts.find((s) => s.value === first(params.sort))?.value ?? "newest";
  return { categories, from: stateCodes.has(from) ? from : null, to: stateCodes.has(to) ? to : null, sort };
}

export function boardQueryString(f: BoardFilters) {
  const p = new URLSearchParams();
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.sort !== "newest") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}
