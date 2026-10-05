type Fields = Record<string, unknown>;

export const sensitiveKey = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|otp|backup[-_]?code|credential|^email$|phone|^address$|street|^ip(address)?$/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?<![\w-])(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}(?![\w-])/g;
const bearerPattern = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g;

export function redactString(value: string) {
  return value.replace(emailPattern, "[email]").replace(phonePattern, "[phone]").replace(bearerPattern, "$1 [redacted]");
}

function serializeError(error: Error, depth: number): Fields {
  const out: Fields = { name: error.name, message: redactString(error.message) };
  if (error.stack) out.stack = redactString(error.stack);
  const digest = (error as { digest?: unknown }).digest;
  if (digest !== undefined) out.digest = String(digest);
  const code = (error as { code?: unknown }).code;
  if (code !== undefined) out.code = String(code);
  if (error.cause !== undefined && depth < 3) out.cause = redact(error.cause, depth + 1);
  return out;
}

export function redact(value: unknown, depth = 0): unknown {
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Error) return serializeError(value, depth);
  if (value instanceof Date) return value.toISOString();
  if (depth > 5) return "[depth]";
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Fields = {};
    for (const [key, v] of Object.entries(value as Fields)) {
      out[key] = sensitiveKey.test(key) && v != null ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return String(value);
}
