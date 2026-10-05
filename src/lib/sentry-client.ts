type SentryModule = typeof import("@sentry/nextjs");

let loading: Promise<SentryModule | null> | null = null;

export function loadSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return Promise.resolve(null);
  loading ??= import("./sentry-browser").then((m) => m.initBrowserSentry()).catch(() => null);
  return loading;
}

export function captureClientError(error: unknown) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  void loadSentry().then((Sentry) => Sentry?.captureException(error));
}
