import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  supportingText?: ReactNode;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, supportingText, error, leading, trailing, className, id, disabled, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = `${inputId}-help`;
  const hasHelp = Boolean(error || supportingText);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "group relative flex h-14 items-center rounded-xs border bg-transparent transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard",
          error
            ? "border-error focus-within:shadow-[inset_0_0_0_1px_var(--md-error)]"
            : "border-outline hover:border-on-surface focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--md-primary)] hover:focus-within:border-primary",
          disabled && "border-on-surface/12 hover:border-on-surface/12",
        )}
      >
        {leading && <span className="pl-3 text-on-surface-variant">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={hasHelp ? helpId : undefined}
          className={cn(
            "peer h-full w-full min-w-0 bg-transparent px-4 text-body-lg text-on-surface outline-none placeholder:text-transparent",
            "disabled:cursor-not-allowed disabled:text-on-surface/38",
            "autofill:shadow-[inset_0_0_0_1000px_var(--md-surface)]",
          )}
          {...rest}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 bg-[var(--field-bg,var(--md-surface))] px-1 text-body-lg text-on-surface-variant transition-[top,left,font-size,line-height,letter-spacing,color] duration-(--duration-short4) ease-standard",
            leading ? "left-11" : "left-3",
            "peer-focus:top-0 peer-focus:left-3 peer-focus:text-body-sm",
            "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-body-sm",
            error ? "text-error peer-focus:text-error" : "peer-focus:text-primary",
            disabled && "text-on-surface/38",
          )}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        {trailing && <span className="flex items-center pr-1 text-on-surface-variant">{trailing}</span>}
      </div>
      {hasHelp && (
        <p key={error ? `e:${error}` : "s"} id={helpId} className={cn("px-4 text-body-sm", error ? "animate-message-in text-error" : "text-on-surface-variant")} role={error ? "alert" : undefined}>
          {error ?? supportingText}
        </p>
      )}
    </div>
  );
});
