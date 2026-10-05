import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ExampleTag } from "./status-chip";

export function UiFrame({ title, children, className, aside }: { title: string; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <figure className={cn("m-0 overflow-hidden rounded-xl border border-outline-variant bg-surface", className)}>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-3">
        <span className="text-title-sm text-on-surface">{title}</span>
        <span className="flex items-center gap-2">
          {aside}
          <ExampleTag />
        </span>
      </figcaption>
      <div className="p-5">{children}</div>
    </figure>
  );
}

export function FieldRows({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-4 gap-y-3 text-body-md">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-on-surface-variant">{r.label}</dt>
          <dd className="text-on-surface">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
