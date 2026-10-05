import { Icon } from "@/components/ui/icon";
import { starIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function Stars({ value, size = 18, className }: { value: number; size?: number; className?: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span role="img" aria-label={`${value.toFixed(1).replace(/\.0$/, "")} out of 5 stars`} className={cn("inline-flex items-center text-warning", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} icon={starIcon} size={size} filled={rounded >= n - 0.25} className={rounded >= n - 0.25 ? undefined : "text-outline-variant"} />
      ))}
    </span>
  );
}
