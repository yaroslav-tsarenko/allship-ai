import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { smartToyIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function UserMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-end", className)}>
      <p className="max-w-[85%] rounded-lg rounded-br-xs bg-primary-container px-4 py-3 text-body-lg text-pretty text-on-primary-container medium:max-w-[75%]">
        <span className="sr-only">You: </span>
        {children}
      </p>
    </div>
  );
}

export function AssistantMessage({ children, className, tool }: { children: ReactNode; className?: string; tool?: string }) {
  return (
    <div className={cn("flex gap-3", className)}>
      <span aria-hidden className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
        <Icon icon={smartToyIcon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">AllShip AI: </span>
        {tool && <p className="mb-2 font-mono text-label-md text-on-surface-variant">{tool}</p>}
        <div className="text-body-lg text-pretty text-on-surface">{children}</div>
      </div>
    </div>
  );
}
