const BASE = "http://internal.invalid";

export function safeRedirectPath(target: string | null | undefined, fallback = "/app") {
  if (typeof target !== "string" || target.length === 0 || target.length > 2048) return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(target)) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(target, BASE);
  } catch {
    return fallback;
  }
  if (parsed.origin !== BASE || parsed.pathname.startsWith("//")) return fallback;
  if (/^\/(?:api|_next)(?:\/|$)/.test(parsed.pathname)) return fallback;
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
