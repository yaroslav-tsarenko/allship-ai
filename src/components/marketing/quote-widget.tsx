import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, keyboardArrowDownIcon, pinDropIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { categories, categoryGroups, type CategoryGroup } from "@/content/categories";
import { cn } from "@/lib/cn";
import { QuoteFormShell } from "./quote-form-shell";

type Props = {
  defaultCategory?: string;
  source: string;
  layout?: "row" | "stack";
  submitLabel?: string;
  className?: string;
  tone?: "surface" | "container";
};

const groups = Object.keys(categoryGroups) as CategoryGroup[];

export function QuoteWidget({ defaultCategory, source, layout = "row", submitLabel = "See my options", className, tone = "surface" }: Props) {
  const field = cn(
    "flex min-h-14 items-center gap-3 rounded-xs border border-outline px-4 transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard hover:border-on-surface focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--md-primary)] hover:focus-within:border-primary",
    tone === "surface" ? "bg-surface" : "bg-surface-container-lowest",
  );

  return (
    <QuoteFormShell source={source} className={cn("grid gap-3", layout === "row" ? "expanded:grid-cols-[1fr_1fr_1fr_auto]" : "grid-cols-1", className)}>
      <input type="hidden" name="src" value={source} />
      <label className={field}>
        <Icon icon={tripOriginIcon} size={20} className="shrink-0 text-on-surface-variant" />
        <span className="sr-only">Pickup city or ZIP</span>
        <input name="from" maxLength={120} placeholder="Pickup city or ZIP" autoComplete="address-level2" className="w-full bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant" />
      </label>
      <label className={field}>
        <Icon icon={pinDropIcon} size={20} className="shrink-0 text-on-surface-variant" />
        <span className="sr-only">Delivery city or ZIP</span>
        <input name="to" maxLength={120} placeholder="Delivery city or ZIP" className="w-full bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant" />
      </label>
      <label className={cn(field, "relative")}>
        <span className="sr-only">What are you shipping</span>
        <select name="category" defaultValue={defaultCategory ?? ""} className="w-full appearance-none bg-transparent pr-8 text-body-lg text-on-surface outline-none has-[option[value='']:checked]:text-on-surface-variant">
          <option value="">What are you shipping?</option>
          {groups.map((g) => (
            <optgroup key={g} label={categoryGroups[g].label}>
              {categories
                .filter((c) => c.group === g)
                .map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <Icon icon={keyboardArrowDownIcon} size={20} className="pointer-events-none absolute right-3 text-on-surface-variant" />
      </label>
      <Button type="submit" size="lg" trailing={<Icon icon={arrowForwardIcon} size={20} />} className="h-14">
        {submitLabel}
      </Button>
    </QuoteFormShell>
  );
}
