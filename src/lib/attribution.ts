export const ATTRIBUTION_COOKIE = "allship_attr";

export const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"] as const;

export type Attribution = Partial<Record<(typeof attributionKeys)[number], string>> & { landing?: string; referrer?: string };

export function parseAttribution(raw: string | undefined): Attribution {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const out: Attribution = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === "string" && v.length <= 300) (out as Record<string, string>)[k] = v;
    return out;
  } catch {
    return {};
  }
}
