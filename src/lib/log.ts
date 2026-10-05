import { redact } from "./redact";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const weights: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const isProd = process.env.NODE_ENV === "production";
const configured = process.env.LOG_LEVEL as Level | undefined;
const minWeight = weights[configured && configured in weights ? configured : isProd ? "info" : "debug"];

const colors: Record<Level, string> = { debug: "\x1b[90m", info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };

type Options = { report?: boolean };

function write(level: Level, msg: string, fields: Fields | undefined, bound: Fields, options?: Options) {
  if (weights[level] < minWeight) return;
  const data = redact({ ...bound, ...fields }) as Fields;
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (isProd) {
    sink(JSON.stringify({ level, time: new Date().toISOString(), msg, ...data }));
  } else {
    const extra = Object.keys(data).length ? ` ${JSON.stringify(data, null, 2)}` : "";
    sink(`${colors[level]}${level.toUpperCase().padEnd(5)}\x1b[0m ${msg}${extra}`);
  }
  if (level === "error" && options?.report !== false) report(fields, data, msg);
}

function report(fields: Fields | undefined, data: Fields, msg: string) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const err = fields?.err;
  import("@sentry/nextjs")
    .then((Sentry) => {
      const extra = { ...data };
      delete extra.err;
      if (err instanceof Error) Sentry.captureException(err, { extra: { ...extra, msg } });
      else Sentry.captureMessage(msg, { level: "error", extra });
    })
    .catch(() => undefined);
}

export type Logger = {
  debug: (msg: string, fields?: Fields) => void;
  info: (msg: string, fields?: Fields) => void;
  warn: (msg: string, fields?: Fields) => void;
  error: (msg: string, fields?: Fields, options?: Options) => void;
  child: (fields: Fields) => Logger;
};

function create(bound: Fields): Logger {
  return {
    debug: (msg, fields) => write("debug", msg, fields, bound),
    info: (msg, fields) => write("info", msg, fields, bound),
    warn: (msg, fields) => write("warn", msg, fields, bound),
    error: (msg, fields, options) => write("error", msg, fields, bound, options),
    child: (fields) => create({ ...bound, ...fields }),
  };
}

export const log = create({});

export function requestIdFrom(headers: { get(name: string): string | null }) {
  return headers.get("x-request-id") ?? headers.get("x-vercel-id") ?? undefined;
}

export async function requestLogger(fields: Fields = {}) {
  try {
    const { headers } = await import("next/headers");
    const requestId = requestIdFrom(await headers());
    return log.child(requestId ? { requestId, ...fields } : fields);
  } catch {
    return log.child(fields);
  }
}
