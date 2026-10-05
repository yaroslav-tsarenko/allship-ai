import { cn } from "@/lib/cn";

export function Glance({ items, className }: { items: { label: string; value: string }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-4 border-t border-outline-variant pt-6 medium:grid-cols-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-label-lg text-on-surface-variant">{item.label}</dt>
          <dd className="mt-1 text-title-md text-pretty text-on-surface">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
