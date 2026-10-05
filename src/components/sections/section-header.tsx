import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { HeadingLevel } from "./types";

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  as: Tag = "h2",
  align = "start",
  actions,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  as?: HeadingLevel;
  align?: "start" | "center";
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "mx-auto items-center text-center", className)}>
      {eyebrow && <p className="text-title-sm font-medium text-primary">{eyebrow}</p>}
      <Tag
        id={id}
        className={cn(
          "max-w-[880px] font-normal text-balance text-on-surface",
          Tag === "h1" ? "text-display-sm tracking-tight medium:text-display-md large:text-display-lg" : "text-headline-lg medium:text-display-sm",
        )}
      >
        {title}
      </Tag>
      {description && <div className="max-w-[720px] text-body-lg text-pretty text-on-surface-variant medium:text-body-xl">{description}</div>}
      {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
