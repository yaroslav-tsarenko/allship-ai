export type HeadlineVariant = { title: string; lead: string; category?: string };

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function pickVariant<K extends string>(variants: Record<K, HeadlineVariant> & { default: HeadlineVariant }, raw: string | string[] | undefined): HeadlineVariant {
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (key && key !== "default" && Object.prototype.hasOwnProperty.call(variants, key)) return variants[key as K];
  return variants.default;
}
