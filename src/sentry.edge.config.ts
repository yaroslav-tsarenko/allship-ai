import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry-options";

Sentry.init({
  ...sentryBaseOptions,
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
});
