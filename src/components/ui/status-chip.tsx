import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { IconData } from "./icons.generated";

export type StatusTone = "neutral" | "primary" | "secondary" | "tertiary" | "success" | "warning" | "error";

const tones: Record<StatusTone, { chip: string; dot: string }> = {
  neutral: { chip: "bg-surface-container-highest text-on-surface-variant", dot: "bg-outline" },
  primary: { chip: "bg-primary-container text-on-primary-container", dot: "bg-primary" },
  secondary: { chip: "bg-secondary-container text-on-secondary-container", dot: "bg-secondary" },
  tertiary: { chip: "bg-tertiary-container text-on-tertiary-container", dot: "bg-tertiary" },
  success: { chip: "bg-success-container text-on-success-container", dot: "bg-success" },
  warning: { chip: "bg-warning-container text-on-warning-container", dot: "bg-warning" },
  error: { chip: "bg-error-container text-on-error-container", dot: "bg-error" },
};

export function StatusChip({
  tone = "neutral",
  icon,
  dot,
  size = "md",
  children,
  className,
}: {
  tone?: StatusTone;
  icon?: IconData;
  dot?: boolean;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-sm font-medium whitespace-nowrap",
        size === "sm" ? "h-6 px-2 text-label-md" : "h-7 px-2.5 text-label-lg",
        t.chip,
        className,
      )}
    >
      {icon ? <Icon icon={icon} size={size === "sm" ? 14 : 16} filled /> : dot ? <span aria-hidden="true" className={cn("size-1.5 rounded-full", t.dot)} /> : null}
      {children}
    </span>
  );
}
