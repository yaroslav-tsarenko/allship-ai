import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { keyboardArrowDownIcon } from "./icons.generated";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size" | "children"> & {
  label: string;
  options: readonly (SelectOption | string)[];
  placeholder?: string;
  supportingText?: ReactNode;
  error?: string;
  leading?: ReactNode;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, options, placeholder = "Select", supportingText, error, leading, className, id, disabled, required, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const helpId = `${selectId}-help`;
  const hasHelp = Boolean(error || supportingText);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "group relative flex h-14 items-center rounded-xs border bg-transparent transition-colors duration-150 ease-standard",
          error
            ? "border-error focus-within:border-2 focus-within:border-error"
            : "border-outline hover:border-on-surface focus-within:border-2 focus-within:border-primary hover:focus-within:border-primary",
          disabled && "border-on-surface/12 hover:border-on-surface/12",
        )}
      >
        {leading && <span className="pl-3 text-on-surface-variant">{leading}</span>}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasHelp ? helpId : undefined}
          className={cn(
            "peer h-full w-full min-w-0 cursor-pointer appearance-none bg-transparent pr-11 pl-4 text-body-lg text-on-surface outline-none",
            "invalid:text-on-surface-variant disabled:cursor-not-allowed disabled:text-on-surface/38",
            "[&>option]:bg-surface-container [&>option]:text-on-surface",
          )}
          {...rest}
        >
          <option value="" disabled={required}>
            {placeholder}
          </option>
          {options.map((o) => {
            const opt = typeof o === "string" ? { value: o, label: o } : o;
            return (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <label
          htmlFor={selectId}
          className={cn(
            "pointer-events-none absolute top-0 left-3 -translate-y-1/2 bg-[var(--field-bg,var(--md-surface))] px-1 text-body-sm text-on-surface-variant transition-colors duration-150 ease-standard",
            error ? "text-error" : "peer-focus:text-primary",
            disabled && "text-on-surface/38",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <Icon
          icon={keyboardArrowDownIcon}
          className={cn("pointer-events-none absolute right-3 text-on-surface-variant transition-transform duration-150", disabled && "text-on-surface/38")}
        />
      </div>
      {hasHelp && (
        <p id={helpId} className={cn("px-4 text-body-sm", error ? "text-error" : "text-on-surface-variant")} role={error ? "alert" : undefined}>
          {error ?? supportingText}
        </p>
      )}
    </div>
  );
});
