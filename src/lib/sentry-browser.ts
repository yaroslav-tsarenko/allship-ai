import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "./sentry-options";

export function initBrowserSentry() {
  Sentry.init({
    ...sentryBaseOptions,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
  return Sentry;
}
