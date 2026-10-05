"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { checkIcon } from "./icons.generated";

type Option<T extends string> = { value: T; label: string; description?: string };

export function SegmentedButton<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: Option<T>[]; label: string }) {
  const index = options.findIndex((o) => o.value === value);
  const indicator: CSSProperties = {
    width: `${100 / options.length}%`,
    transform: `translateX(${Math.max(index, 0) * 100}%)`,
    opacity: index < 0 ? 0 : 1,
  };
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      className="relative grid overflow-hidden rounded-full border border-outline"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 bg-secondary-container transition-[transform,opacity] duration-(--duration-medium2) ease-(--ease-emphasized)"
        style={indicator}
      />
      {options.map((o, i) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            "state-layer flex h-12 cursor-pointer items-center justify-center gap-2 px-3 text-label-lg font-medium text-on-surface transition-colors duration-(--duration-medium2) ease-standard",
            i > 0 && "border-l border-outline",
            "data-[state=checked]:text-on-secondary-container",
          )}
        >
          <RadioGroup.Indicator className="inline-flex w-[18px] animate-grow-in overflow-hidden">
            <Icon icon={checkIcon} size={18} className="shrink-0" />
          </RadioGroup.Indicator>
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
