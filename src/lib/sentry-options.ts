import type { Breadcrumb, ErrorEvent, NodeOptions } from "@sentry/nextjs";
import { redact, redactString, sensitiveKey } from "./redact";

type StreamedSpan = Parameters<NonNullable<NodeOptions["beforeSendSpan"]>>[0];

const droppedHeaders = /^(cookie|set-cookie|authorization|proxy-authorization|x-forwarded-for|x-real-ip|x-vercel-forwarded-for|x-vercel-ip-.*|cf-connecting-ip|stripe-signature)$/i;

function scrubHeaders(headers: Record<string, string> | undefined) {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (droppedHeaders.test(key)) continue;
    out[key] = sensitiveKey.test(key) ? "[redacted]" : redactString(String(value));
  }
  return out;
}

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (event.request) {
    delete event.request.cookies;
    event.request.headers = scrubHeaders(event.request.headers);
    if (event.request.data !== undefined) event.request.data = redact(event.request.data);
    if (typeof event.request.query_string === "string") event.request.query_string = redactString(event.request.query_string);
    if (event.request.url) event.request.url = redactString(event.request.url);
  }
  if (event.message) event.message = redactString(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = redactString(ex.value);
  }
  if (event.extra) event.extra = redact(event.extra) as Record<string, unknown>;
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  return event;
}

function scrubSpan(span: StreamedSpan): StreamedSpan {
  return { ...span, name: redactString(span.name), attributes: redact(span.attributes) as StreamedSpan["attributes"] };
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  return {
    ...crumb,
    message: crumb.message ? redactString(crumb.message) : crumb.message,
    data: crumb.data ? (redact(crumb.data) as Record<string, unknown>) : crumb.data,
  };
}

const sampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1);

export const sentryBaseOptions = {
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: Number.isFinite(sampleRate) ? Math.min(Math.max(sampleRate, 0), 1) : 0.1,
  sendDefaultPii: false,
  beforeSend: (event: ErrorEvent) => scrubEvent(event),
  beforeSendSpan: (span: StreamedSpan) => scrubSpan(span),
  beforeBreadcrumb: (crumb: Breadcrumb) => scrubBreadcrumb(crumb),
  ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND", "NEXT_HTTP_ERROR_FALLBACK"],
};
