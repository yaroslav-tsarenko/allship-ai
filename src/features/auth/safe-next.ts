import { safeRedirectPath } from "@/lib/security/safe-redirect";

export function safeNext(next: string | null | undefined, fallback = "/app") {
  return safeRedirectPath(next, fallback);
}
