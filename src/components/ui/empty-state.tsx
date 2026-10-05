import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { IconData } from "./icons.generated";

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact,
  headingLevel = 2,
  className,
}: {
  icon?: IconData;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  compact?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-3 px-6 py-8" : "gap-4 px-6 py-14 medium:py-20", className)}>
      {icon && (
        <span className={cn("flex items-center justify-center rounded-full bg-secondary-container text-on-secondary-container", compact ? "size-12" : "size-16")}>
          <Icon icon={icon} size={compact ? 24 : 32} />
        </span>
      )}
      <div className="max-w-[440px]">
        <Heading className={cn("text-on-surface", compact ? "text-title-md" : "text-title-lg")}>{title}</Heading>
        {description && <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
