"use client";

import { useCallback, useId, useRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function useTrackOnce(tool: string) {
  const sent = useRef(false);
  return useCallback(() => {
    if (sent.current) return;
    sent.current = true;
    track("calculator_used", { tool });
  }, [tool]);
}

export function parseNumber(value: string) {
  if (value.trim() === "") return Number.NaN;
  return Number(value.replace(/,/g, ""));
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  supportingText?: ReactNode;
};

export function SelectField({ label, options, supportingText, className, id, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const helpId = `${selectId}-help`;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="relative flex h-14 items-center rounded-xs border border-outline transition-colors duration-150 ease-standard focus-within:border-2 focus-within:border-primary hover:border-on-surface hover:focus-within:border-primary">
        <label htmlFor={selectId} className="pointer-events-none absolute top-0 left-3 -translate-y-1/2 bg-surface px-1 text-body-sm text-on-surface-variant">
          {label}
        </label>
        <select
          id={selectId}
          aria-describedby={supportingText ? helpId : undefined}
          className="h-full w-full cursor-pointer appearance-none bg-transparent pr-10 pl-4 text-body-lg text-on-surface outline-none"
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon icon={keyboardArrowDownIcon} size={20} className="pointer-events-none absolute right-3 text-on-surface-variant" />
      </div>
      {supportingText && (
        <p id={helpId} className="px-4 text-body-sm text-on-surface-variant">
          {supportingText}
        </p>
      )}
    </div>
  );
}

export function FieldGroup({ legend, children, hint, className }: { legend: string; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-3", className)}>
      <legend className="mb-3 text-title-sm text-on-surface">{legend}</legend>
      {children}
      {hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>}
    </fieldset>
  );
}

export function Unit({ children }: { children: ReactNode }) {
  return <span className="pr-3 text-body-md text-on-surface-variant">{children}</span>;
}

export function CalculatorLayout({ inputs, result, label }: { inputs: ReactNode; result: ReactNode; label: string }) {
  return (
    <div className="grid gap-8 expanded:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] expanded:items-start large:gap-12">
      <form aria-label={label} onSubmit={(e) => e.preventDefault()} className="flex min-w-0 flex-col gap-8">
        {inputs}
      </form>
      <aside aria-label="Result" className="expanded:sticky expanded:top-24">
        {result}
      </aside>
    </div>
  );
}

export function ResultPanel({ eyebrow, children, footer }: { eyebrow: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-surface-container-low">
      <div className="p-6 medium:p-7" aria-live="polite" aria-atomic="true">
        <p className="text-label-lg text-on-surface-variant">{eyebrow}</p>
        {children}
      </div>
      {footer && <div className="border-t border-outline-variant px-6 py-5 medium:px-7">{footer}</div>}
    </div>
  );
}

export function ResultRows({ rows }: { rows: Array<{ label: string; value: string; strong?: boolean; hidden?: boolean }> }) {
  return (
    <dl className="mt-6 flex flex-col">
      {rows
        .filter((r) => !r.hidden)
        .map((r) => (
          <div key={r.label} className={cn("flex items-baseline justify-between gap-4 border-t border-outline-variant py-2.5", r.strong && "text-on-surface")}>
            <dt className={cn("text-body-md", r.strong ? "font-medium text-on-surface" : "text-on-surface-variant")}>{r.label}</dt>
            <dd className={cn("font-mono text-body-md tabular-nums", r.strong ? "font-medium text-on-surface" : "text-on-surface")}>{r.value}</dd>
          </div>
        ))}
    </dl>
  );
}
