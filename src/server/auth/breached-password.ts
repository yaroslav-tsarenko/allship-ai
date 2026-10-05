import "server-only";
import { createHash } from "node:crypto";

export async function isBreachedPassword(password: string) {
  const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "AllShip-AI" },
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = await res.text();
    return body.split("\n").some((line) => {
      const [s, count] = line.trim().split(":");
      return s === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
