import type { Instrumentation } from "next";
import { log, requestIdFrom } from "@/lib/log";

const sentryEnabled = () => Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export async function register() {
  if (!sentryEnabled()) return;
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const header = (name: string) => {
    const value = request.headers[name];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  };
  log.error("request failed", {
    err: error,
    requestId: requestIdFrom({ get: header }),
    method: request.method,
    path: request.path.split("?")[0],
    route: context.routePath,
    routeType: context.routeType,
  }, { report: false });
  if (!sentryEnabled()) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
