"use client";

import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { checkIcon } from "./icons.generated";

export type StepperStep = { label: string; description?: string };

export function Stepper({
  steps,
  current,
  onStepClick,
  className,
  label = "Progress",
}: {
  steps: StepperStep[];
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
  label?: string;
}) {
  const progress = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
  const active = steps[current];

  return (
    <nav aria-label={label} className={className}>
      <div className="medium:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-title-md text-on-surface">{active?.label}</p>
          <p className="text-label-lg text-on-surface-variant tabular-nums">
            Step {current + 1} of {steps.length}
          </p>
        </div>
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-secondary-container"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
          aria-label={`Step ${current + 1} of ${steps.length}`}
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-emphasized-decelerate" style={{ width: `${Math.max(progress, 4)}%` }} />
        </div>
      </div>
      <ol className="hidden items-center medium:flex">
        {steps.map((step, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const clickable = Boolean(onStepClick) && done;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-label-lg font-medium transition-colors duration-200 ease-standard",
                  done && "bg-primary text-on-primary",
                  isCurrent && "bg-primary-container text-on-primary-container ring-2 ring-primary",
                  !done && !isCurrent && "border border-outline text-on-surface-variant",
                )}
              >
                {done ? <Icon icon={checkIcon} size={18} /> : i + 1}
              </span>
              <span className="min-w-0 text-left">
                <span className={cn("block truncate text-label-lg", isCurrent ? "text-on-surface" : "text-on-surface-variant")}>{step.label}</span>
                {step.description && <span className="block truncate text-body-sm text-on-surface-variant">{step.description}</span>}
              </span>
            </>
          );
          return (
            <li key={step.label} className={cn("flex min-w-0 items-center", i < steps.length - 1 && "flex-1")}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(i)}
                  className="state-layer -mx-2 flex min-w-0 cursor-pointer items-center gap-3 rounded-full px-2 py-1"
                >
                  {content}
                  <span className="sr-only">, completed. Go back to this step</span>
                </button>
              ) : (
                <span className="flex min-w-0 items-center gap-3 py-1" aria-current={isCurrent ? "step" : undefined}>
                  {content}
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="mx-3 h-px min-w-6 flex-1 overflow-hidden bg-outline-variant">
                  <span className={cn("block h-full origin-left bg-primary transition-transform duration-500 ease-emphasized-decelerate", done ? "scale-x-100" : "scale-x-0")} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
