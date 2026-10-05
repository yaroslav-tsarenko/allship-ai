import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { checkIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export type FilterOption = { value: string; label: string; count?: number; href: string };

export function FilterChips({ label, options, value }: { label: string; options: FilterOption[]; value: string }) {
  return (
    <nav aria-label={label} className="-mx-4 min-w-0 flex-1 overflow-x-auto px-4 [scrollbar-width:none] medium:mx-0 medium:overflow-visible medium:px-0 [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-2 medium:flex-wrap">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <li key={o.value} className="shrink-0">
              <Link
                href={o.href}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "state-layer inline-flex h-8 items-center gap-2 rounded-sm border text-label-lg font-medium whitespace-nowrap transition-colors duration-150 ease-standard",
                  selected ? "border-transparent bg-secondary-container pr-4 pl-2 text-on-secondary-container" : "border-outline-variant px-4 text-on-surface-variant",
                )}
              >
                {selected && <Icon icon={checkIcon} size={18} />}
                {o.label}
                {o.count !== undefined && <span className={cn("tabular-nums", selected ? "text-on-secondary-container/80" : "text-on-surface-variant/80")}>{o.count.toLocaleString("en-US")}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
