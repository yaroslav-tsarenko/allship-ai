export type CspViolation = {
  documentUri?: string;
  blockedUri?: string;
  directive?: string;
  disposition?: string;
  sourceFile?: string;
  line?: number;
  sample?: string;
};

const text = (value: unknown, max = 512) => (typeof value === "string" ? value.slice(0, max) : undefined);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

function stripQuery(value: string | undefined) {
  if (!value) return value;
  const at = value.search(/[?#]/);
  return at === -1 ? value : value.slice(0, at);
}

function fromLegacy(body: Record<string, unknown>): CspViolation {
  return {
    documentUri: stripQuery(text(body["document-uri"])),
    blockedUri: stripQuery(text(body["blocked-uri"])),
    directive: text(body["effective-directive"] ?? body["violated-directive"], 128),
    disposition: text(body.disposition, 16),
    sourceFile: stripQuery(text(body["source-file"])),
    line: num(body["line-number"]),
    sample: text(body["script-sample"], 80),
  };
}

function fromReportingApi(body: Record<string, unknown>): CspViolation {
  return {
    documentUri: stripQuery(text(body.documentURL)),
    blockedUri: stripQuery(text(body.blockedURL)),
    directive: text(body.effectiveDirective, 128),
    disposition: text(body.disposition, 16),
    sourceFile: stripQuery(text(body.sourceFile)),
    line: num(body.lineNumber),
    sample: text(body.sample, 80),
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeCspReports(payload: unknown): CspViolation[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((r) => isRecord(r) && r.type === "csp-violation" && isRecord(r.body))
      .map((r) => fromReportingApi((r as { body: Record<string, unknown> }).body));
  }
  if (isRecord(payload) && isRecord(payload["csp-report"])) return [fromLegacy(payload["csp-report"])];
  return [];
}
