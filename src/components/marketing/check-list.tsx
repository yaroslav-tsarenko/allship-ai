import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { checkIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function CheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-body-lg text-on-surface">
          <Icon icon={checkIcon} size={22} className="mt-0.5 shrink-0 text-primary" />
          <span className="text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}
