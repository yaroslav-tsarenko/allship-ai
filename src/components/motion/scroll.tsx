import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ScrubWordsProps = { text: string; accent?: string[]; as?: ElementType; className?: string; id?: string };

export function ScrubWords({ text, accent = [], as: Tag = "p", className, id }: ScrubWordsProps) {
  const marked = new Set(accent.map((w) => w.toLowerCase()));
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag id={id} data-scrub="words" className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span data-w="" className={marked.has(w.replace(/[^\p{L}\p{N}%$-]/gu, "").toLowerCase()) ? "text-primary" : undefined}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

export function PinnedRow({ children, className, trackClassName, label }: { children: ReactNode; className?: string; trackClassName?: string; label?: string }) {
  return (
    <div
      data-pin="x"
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className={cn("overflow-x-auto overscroll-x-contain [scrollbar-width:thin] data-[pinned]:overflow-visible", className)}
    >
      <div data-pin-track="" className={cn("flex w-max snap-x snap-mandatory gap-4 px-4 medium:px-8 [&>*]:snap-start", trackClassName)}>
        {children}
      </div>
    </div>
  );
}

export function SectionProgress({ target, className }: { target?: string; className?: string }) {
  return <div aria-hidden="true" data-progress={target ?? ""} style={{ transform: "scaleX(0)" }} className={cn("h-0.5 origin-left bg-primary motion-reduce:hidden", className)} />;
}
