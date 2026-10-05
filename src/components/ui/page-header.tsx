import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-2 pb-6 medium:pt-4">
      <div className="min-w-0">
        <h1 className="text-headline-md text-on-surface medium:text-headline-lg">{title}</h1>
        {description && <p className="mt-1 text-body-lg text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
