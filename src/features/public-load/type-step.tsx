"use client";

import Image from "next/image";
import { get, useFormContext, useWatch } from "react-hook-form";
import { categories } from "@/content/categories";
import { cn } from "@/lib/cn";
import type { LoadCategory } from "@/server/db/schema/enums";
import type { PublicLoadValues } from "./model";

export function TypeStep({ choices, onPick }: { choices: LoadCategory[]; onPick: (category: LoadCategory) => void }) {
  const { control, formState } = useFormContext<PublicLoadValues>();
  const selected = useWatch({ control, name: "category" });
  const error = get(formState.errors, "category")?.message as string | undefined;
  const items = choices.map((key) => categories.find((c) => c.key === key)!).filter(Boolean);

  return (
    <fieldset>
      <legend className="sr-only">Load type</legend>
      {error && (
        <p role="alert" className="mb-4 animate-message-in text-body-md text-error">
          {error}
        </p>
      )}
      <ul role="list" className="grid grid-cols-2 gap-3 medium:grid-cols-3">
        {items.map((c, i) => {
          const active = selected === c.key;
          return (
            <li key={c.key}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onPick(c.key)}
                className={cn(
                  "state-layer group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md border text-left transition-[border-color,background-color] duration-(--duration-medium2) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  active ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant bg-surface text-on-surface hover:border-outline",
                )}
              >
                <span className={cn("relative block aspect-[4/3] w-full overflow-hidden", c.image.cutout ? "bg-white dark:brightness-90" : "bg-surface-container-high")}>
                  <Image
                    src={c.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 840px) 240px, 45vw"
                    loading={i < 6 ? "eager" : "lazy"}
                    className={cn(c.image.cutout ? "object-contain p-4" : "object-cover", "transition-transform duration-(--duration-long2) ease-standard motion-safe:group-hover:scale-[1.03]")}
                  />
                </span>
                <span className="flex flex-1 flex-col gap-0.5 p-3">
                  <span className="text-title-sm">{c.name}</span>
                  <span className={cn("line-clamp-2 text-body-sm", active ? "text-on-primary-container/80" : "text-on-surface-variant")}>{c.summary}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
