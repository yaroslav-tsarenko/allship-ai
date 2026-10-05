"use client";

import { forwardRef, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<typeof TextField>, "onChange" | "value" | "leading"> & {
  value: string;
  onValueChange: (value: string) => void;
  leading?: ReactNode;
};

const cache = new Map<string, string[]>();

async function fetchSuggestions(q: string) {
  const key = q.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await fetch(`/moving/places?q=${encodeURIComponent(key)}`);
  if (!res.ok) return [];
  const { items } = (await res.json()) as { items: string[] };
  cache.set(key, items);
  return items;
}

export const PlaceField = forwardRef<HTMLInputElement, Props>(function PlaceField({ value, onValueChange, onBlur, className, ...field }, ref) {
  const listId = useId();
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current) return;
    const q = value.trim();
    let cancelled = false;
    const id = window.setTimeout(
      async () => {
        const next = q.length < 2 ? [] : await fetchSuggestions(q).catch(() => []);
        if (cancelled) return;
        setItems(next.filter((s) => s.toLowerCase() !== q.toLowerCase()));
        setOpen(true);
        setActive(-1);
      },
      q.length < 2 ? 0 : 160,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [value]);

  const pick = (s: string) => {
    typed.current = false;
    onValueChange(s);
    setOpen(false);
    setItems([]);
  };

  const expanded = open && items.length > 0;

  return (
    <div className={cn("relative", className)}>
      <TextField
        {...field}
        ref={ref}
        value={value}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        inputMode="text"
        onChange={(e) => {
          typed.current = true;
          onValueChange(e.target.value);
        }}
        onBlur={(e) => {
          window.setTimeout(() => setOpen(false), 120);
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (!expanded) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      <ul id={listId} role="listbox" aria-label="Suggested places" hidden={!expanded} className="absolute inset-x-0 top-[60px] z-30 overflow-hidden rounded-xs bg-surface-container py-2 shadow-elevation-2">
        {items.map((s, i) => (
          <li
            key={s}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              pick(s);
            }}
            className={cn("cursor-pointer px-4 py-2.5 text-body-lg text-on-surface", i === active ? "bg-on-surface/8" : "hover:bg-on-surface/8")}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
});
