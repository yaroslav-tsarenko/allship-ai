import { loadSentry } from "@/lib/sentry-client";

type Transition = "push" | "replace" | "traverse";

let sentry: Awaited<ReturnType<typeof loadSentry>> = null;

const start = () => void loadSentry().then((mod) => (sentry = mod));

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  if (/^\/(app|admin)(\/|$)/.test(window.location.pathname)) {
    if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 4000 });
    else setTimeout(start, 2000);
  } else {
    const report = (error: unknown) => {
      if (sentry) return;
      void loadSentry().then((mod) => {
        if (sentry || !mod) return;
        sentry = mod;
        mod.captureException(error);
      });
    };
    const onError = (event: ErrorEvent) => report(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => report(event.reason);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
  }
}

export function onRouterTransitionStart(url: string, navigationType: Transition) {
  if (!sentry && process.env.NEXT_PUBLIC_SENTRY_DSN && /^\/(app|admin)(\/|$)/.test(new URL(url, window.location.href).pathname)) start();
  sentry?.captureRouterTransitionStart(url, navigationType);
}
