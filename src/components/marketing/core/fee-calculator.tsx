"use client";

import { useId, useState } from "react";
import { site } from "@/content/site";
import { feeBreakdown, formatUsd } from "./money";

export function FeeCalculator() {
  const id = useId();
  const [value, setValue] = useState("1500");
  const dollars = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  const valid = Number.isFinite(dollars) && dollars > 0 && dollars < 10_000_000;
  const { bid, fee, total } = feeBreakdown(valid ? Math.round(dollars * 100) : 0);

  return (
    <div className="rounded-xl bg-surface-container-low p-6 medium:p-8">
      <label htmlFor={id} className="text-title-md text-on-surface">
        Try a bid amount
      </label>
      <div className="mt-3 flex min-h-14 items-center gap-2 rounded-xs border border-outline bg-surface px-4 focus-within:border-2 focus-within:border-primary">
        <span className="text-title-lg text-on-surface-variant">$</span>
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={`${id}-out`}
          className="w-full bg-transparent font-mono text-title-lg text-on-surface outline-none"
        />
      </div>
      <dl id={`${id}-out`} aria-live="polite" className="mt-6 grid grid-cols-[1fr_auto] gap-y-3 [&_dd]:pl-6 text-body-lg">
        <dt className="text-on-surface-variant">Carrier&rsquo;s bid</dt>
        <dd className="text-right font-mono text-on-surface">{formatUsd(bid)}</dd>
        <dt className="text-on-surface-variant">Service fee, {site.platformFeePercent}%</dt>
        <dd className="text-right font-mono text-on-surface">{formatUsd(fee)}</dd>
        <dt className="border-t border-outline-variant pt-3 text-title-md text-on-surface">Total you pay</dt>
        <dd className="border-t border-outline-variant pt-3 text-right font-mono text-title-lg text-on-surface">{formatUsd(total)}</dd>
      </dl>
      {!valid && value.trim() !== "" && <p className="mt-3 text-body-md text-error">Enter a dollar amount, for example 1500.</p>}
    </div>
  );
}
