"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import { publicEnv as env } from "@/lib/public-env";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const turnstileEnabled = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const mount = useCallback(() => {
    if (!ref.current || !window.turnstile || widgetId.current || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      appearance: "interaction-only",
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });
  }, [onToken]);

  useEffect(() => {
    mount();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [mount]);

  useEffect(() => {
    if (resetKey && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onToken(null);
    }
  }, [resetKey, onToken]);

  if (!turnstileEnabled) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={ref} className="min-h-0 empty:hidden" />
    </>
  );
}

export function captchaHeaders(token: string | null) {
  return token ? { headers: { "x-captcha-response": token } } : undefined;
}
