"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { checkIcon, keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { categories, categoryGroups, type CategoryGroup } from "@/content/categories";
import { US_STATES } from "@/features/loads/schema";
import type { LoadCategory } from "@/server/db/schema/enums";
import { boardQueryString, boardSorts, type BoardFilters as Filters, type BoardSort } from "./filters";

const menuClass =
  "z-50 max-h-[min(420px,var(--radix-dropdown-menu-content-available-height))] min-w-[220px] overflow-y-auto rounded-xs bg-surface-container py-2 text-on-surface shadow-elevation-2 outline-none";
const itemClass =
  "state-layer flex h-12 cursor-pointer items-center gap-3 px-3 text-body-lg outline-none select-none data-highlighted:bg-on-surface/8";

function MenuChip({ label, selected, children }: { label: ReactNode; selected: boolean; children: ReactNode }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>
        <Chip
          variant="filter"
          selected={selected}
          aria-pressed={undefined}
          label={
            <span className="inline-flex items-center gap-1">
              {label}
              <Icon icon={keyboardArrowDownIcon} size={18} className="-mr-2" />
            </span>
          }
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="start" sideOffset={4} className={menuClass}>
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

function Check({ on }: { on: boolean }) {
  return <span className="flex size-6 items-center justify-center">{on && <Icon icon={checkIcon} size={20} className="text-primary" />}</span>;
}

export function BoardFilters({ filters, total }: { filters: Filters; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const apply = (next: Partial<Filters>) => {
    startTransition(() => router.replace(`${pathname}${boardQueryString({ ...filters, ...next })}`, { scroll: false }));
  };

  const toggleCategory = (key: LoadCategory) => {
    const set = new Set(filters.categories);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    apply({ categories: [...set] });
  };

  const stateMenu = (which: "from" | "to") => {
    const value = filters[which];
    const title = which === "from" ? "Pickup state" : "Delivery state";
    return (
      <MenuChip label={value ? `${which === "from" ? "From" : "To"} ${value}` : which === "from" ? "From" : "To"} selected={Boolean(value)}>
        <Menu.Label className="px-3 pt-1 pb-2 text-label-md text-on-surface-variant">{title}</Menu.Label>
        <Menu.RadioGroup value={value ?? ""} onValueChange={(v) => apply({ [which]: v || null })}>
          <Menu.RadioItem value="" className={itemClass}>
            <Check on={!value} />
            Any state
          </Menu.RadioItem>
          {US_STATES.map(([code, name]) => (
            <Menu.RadioItem key={code} value={code} className={itemClass}>
              <Check on={value === code} />
              <span className="flex-1">{name}</span>
              <span className="text-label-md text-on-surface-variant">{code}</span>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </MenuChip>
    );
  };

  const groups = Object.entries(categoryGroups) as [CategoryGroup, { label: string }][];
  const hasFilters = filters.categories.length > 0 || filters.from || filters.to;
  const sortLabel = boardSorts.find((s) => s.value === filters.sort)?.label ?? "Newest";

  return (
    <div data-tour="board-filters" className="flex flex-col gap-3">
      <ChipSet label="Filter loads" className="-mx-4 flex-nowrap overflow-x-auto px-4 pb-1 [scrollbar-width:none] medium:mx-0 medium:flex-wrap medium:overflow-visible medium:px-0">
        {groups.map(([group, meta]) => {
          const inGroup = categories.filter((c) => c.group === group);
          const picked = inGroup.filter((c) => filters.categories.includes(c.key));
          const label = picked.length === 1 ? picked[0]!.shortName : picked.length > 1 ? `${meta.label} · ${picked.length}` : meta.label;
          return (
            <MenuChip key={group} label={label} selected={picked.length > 0}>
              <Menu.Label className="px-3 pt-1 pb-2 text-label-md text-on-surface-variant">{meta.label}</Menu.Label>
              {inGroup.map((c) => {
                const on = filters.categories.includes(c.key);
                return (
                  <Menu.CheckboxItem
                    key={c.key}
                    checked={on}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleCategory(c.key)}
                    className={itemClass}
                  >
                    <Check on={on} />
                    {c.name}
                  </Menu.CheckboxItem>
                );
              })}
            </MenuChip>
          );
        })}
        <span aria-hidden="true" className="mx-1 hidden h-8 w-px shrink-0 bg-outline-variant medium:block" />
        {stateMenu("from")}
        {stateMenu("to")}
      </ChipSet>
      <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-body-md text-on-surface-variant" role="status" aria-live="polite">
          {pending ? "Updating…" : `${total} ${total === 1 ? "load" : "loads"} open for bids`}
        </p>
        {hasFilters && (
          <button type="button" onClick={() => apply({ categories: [], from: null, to: null })} className="state-layer -mx-3 h-10 cursor-pointer rounded-full px-3 text-label-lg text-primary">
            Clear filters
          </button>
        )}
        <div data-tour="board-sort" className="ml-auto">
          <Menu.Root modal={false}>
            <Menu.Trigger className="state-layer inline-flex h-10 cursor-pointer items-center gap-1 rounded-full pr-2 pl-3 text-label-lg text-on-surface-variant">
              Sort: <span className="text-on-surface">{sortLabel}</span>
              <Icon icon={keyboardArrowDownIcon} size={18} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content align="end" sideOffset={4} className={menuClass}>
                <Menu.RadioGroup value={filters.sort} onValueChange={(v) => apply({ sort: v as BoardSort })}>
                  {boardSorts.map((s) => (
                    <Menu.RadioItem key={s.value} value={s.value} className={itemClass}>
                      <Check on={filters.sort === s.value} />
                      {s.label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
        </div>
      </div>
    </div>
  );
}
