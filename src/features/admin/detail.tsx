import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="state-layer -ml-3 inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-lg font-medium text-primary">
      <Icon icon={arrowBackIcon} size={18} />
      {label}
    </Link>
  );
}

export function Panel({ title, description, actions, children, className, flush }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <Card as="section" className={cn("overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-3">
        <div className="min-w-0">
          <h2 className="text-title-lg text-on-surface">{title}</h2>
          {description && <p className="mt-0.5 text-body-md text-on-surface-variant">{description}</p>}
        </div>
        {actions}
      </div>
      <div className={flush ? undefined : "px-6 pb-6"}>{children}</div>
    </Card>
  );
}

export function Fields({ items }: { items: { label: string; value: ReactNode; mono?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 medium:gap-x-8">
      {items.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="text-label-md text-on-surface-variant">{f.label}</dt>
          <dd className={cn("mt-0.5 break-words text-body-lg text-on-surface", f.mono && "font-mono text-body-md")}>{f.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ items, empty }: { items: { id: string; title: ReactNode; meta: ReactNode; body?: ReactNode }[]; empty: string }) {
  if (items.length === 0) return <p className="text-body-md text-on-surface-variant">{empty}</p>;
  return (
    <ol className="relative">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          <span aria-hidden="true" className="relative flex w-3 shrink-0 justify-center">
            <span className={cn("mt-1.5 size-2.5 rounded-full", i === 0 ? "bg-primary" : "border-2 border-outline bg-surface")} />
            {i < items.length - 1 && <span className="absolute top-5 bottom-[-0.25rem] w-px bg-outline-variant" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body-lg text-on-surface">{item.title}</p>
            <p className="text-body-sm text-on-surface-variant">{item.meta}</p>
            {item.body && <div className="mt-1 text-body-md text-on-surface-variant">{item.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
