"use client";

import { forwardRef, useCallback, useEffect, useId, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  supportingText?: ReactNode;
  error?: string;
  showCount?: boolean;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, supportingText, error, showCount, className, id, disabled, required, rows = 4, maxLength, onChange, value, defaultValue, ...rest },
  ref,
) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const helpId = `${areaId}-help`;
  const [length, setLength] = useState(() => String(value ?? defaultValue ?? "").length);
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    if (!showCount || value !== undefined) return;
    const node = inner.current;
    if (!node) return;
    const sync = () => setLength(node.value.length);
    const frame = requestAnimationFrame(sync);
    node.form?.addEventListener("reset", sync);
    return () => {
      cancelAnimationFrame(frame);
      node.form?.removeEventListener("reset", sync);
    };
  });
  const count = value !== undefined ? String(value).length : length;
  const counter = showCount && maxLength ? `${count.toLocaleString("en-US")} / ${maxLength.toLocaleString("en-US")}` : null;
  const hasHelp = Boolean(error || supportingText || counter);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "relative rounded-xs border bg-transparent transition-colors duration-150 ease-standard",
          error
            ? "border-error focus-within:border-2 focus-within:border-error"
            : "border-outline hover:border-on-surface focus-within:border-2 focus-within:border-primary hover:focus-within:border-primary",
          disabled && "border-on-surface/12 hover:border-on-surface/12",
        )}
      >
        <textarea
          ref={setRefs}
          id={areaId}
          rows={rows}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={hasHelp ? helpId : undefined}
          onChange={(e) => {
            setLength(e.target.value.length);
            onChange?.(e);
          }}
          className={cn(
            "peer block w-full min-w-0 resize-y bg-transparent px-4 pt-4 pb-3 text-body-lg text-on-surface outline-none placeholder:text-transparent",
            "disabled:cursor-not-allowed disabled:text-on-surface/38",
          )}
          {...rest}
        />
        <label
          htmlFor={areaId}
          className={cn(
            "pointer-events-none absolute top-4 left-3 bg-[var(--field-bg,var(--md-surface))] px-1 text-body-lg text-on-surface-variant transition-all duration-150 ease-standard",
            "peer-focus:-top-2 peer-focus:text-body-sm",
            "peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-body-sm",
            error ? "text-error peer-focus:text-error" : "peer-focus:text-primary",
            disabled && "text-on-surface/38",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      </div>
      {hasHelp && (
        <div id={helpId} className={cn("flex gap-4 px-4 text-body-sm", error ? "text-error" : "text-on-surface-variant")}>
          <p className="min-w-0 flex-1" role={error ? "alert" : undefined}>
            {error ?? supportingText}
          </p>
          {counter && <span className="shrink-0 tabular-nums text-on-surface-variant">{counter}</span>}
        </div>
      )}
    </div>
  );
});
