"use client";

import { useEffect } from "react";
import { afterLoadIdle } from "@/lib/idle";
import { ATTRIBUTION_COOKIE, attributionKeys, type Attribution } from "@/lib/attribution";

export function AttributionCapture() {
  useEffect(() => afterLoadIdle(capture), []);
  return null;
}

function capture() {
  const params = new URLSearchParams(window.location.search);
  const found: Attribution = {};
  for (const key of attributionKeys) {
    const v = params.get(key);
    if (v) found[key] = v.slice(0, 300);
  }
  const hasCookie = document.cookie.includes(`${ATTRIBUTION_COOKIE}=`);
  if (Object.keys(found).length === 0 && hasCookie) return;
  const value: Attribution = { ...found, landing: window.location.pathname, referrer: document.referrer ? new URL(document.referrer).hostname : undefined };
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}
