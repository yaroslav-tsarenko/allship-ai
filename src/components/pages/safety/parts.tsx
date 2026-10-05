import { cn } from "@/lib/cn";

export function NumberedList({ items, label, className }: { items: { title: string; body: string }[]; label: string; className?: string }) {
  return (
    <ol aria-label={label} className={cn("border-t border-outline-variant", className)}>
      {items.map((item, i) => (
        <li key={item.title} className="grid grid-cols-[2.75rem_1fr] gap-x-3 border-b border-outline-variant py-5">
          <span className="font-mono text-title-md text-primary tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <span>
            <span className="block text-title-lg text-on-surface">{item.title}</span>
            <span className="mt-1 block text-body-lg text-pretty text-on-surface-variant">{item.body}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
