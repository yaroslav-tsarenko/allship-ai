export type CurvePoint = { miles: number; low: number; high: number };

export function interpolate(points: readonly CurvePoint[], miles: number): { low: number; high: number } {
  const m = Math.max(0, miles);
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return { low: 0, high: 0 };
  if (m <= first.miles) return { low: first.low, high: first.high };
  if (m >= last.miles) return { low: last.low, high: last.high };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b && m <= b.miles) {
      const t = (m - a.miles) / (b.miles - a.miles);
      return { low: a.low + (b.low - a.low) * t, high: a.high + (b.high - a.high) * t };
    }
  }
  return { low: last.low, high: last.high };
}

export function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

export function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export const num1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
export const num2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
