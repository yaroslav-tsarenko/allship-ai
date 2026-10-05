import Link from "next/link";
import type { ComponentType } from "react";
import { Container } from "@/components/marketing/section";
import { CarCarrier, Dolly, Pallet, type IllustrationProps } from "@/components/theater/illustrations";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { homeCategories, type HomeCategory } from "./content";
import { Excavator } from "./excavator";

const art: Record<HomeCategory["key"], ComponentType<IllustrationProps>> = {
  vehicles: CarCarrier,
  moving: Dolly,
  heavy: Excavator,
  freight: Pallet,
};

export function HomeCategories() {
  return (
    <section aria-labelledby="home-categories" className="relative pt-4 pb-14 medium:pb-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-outline-variant pb-4">
          <h2 id="home-categories" className="text-title-lg text-on-surface medium:text-headline-sm">
            What are you shipping?
          </h2>
          <Link href="/all" className="inline-flex items-center gap-1 rounded-xs text-label-lg font-medium text-primary underline-offset-4 hover:underline">
            All 23 categories
            <Icon icon={arrowForwardIcon} size={16} />
          </Link>
        </div>
        <ul className="grid medium:grid-cols-2 large:grid-cols-4">
          {homeCategories.map((c, i) => {
            const Art = art[c.key];
            return (
              <li
                key={c.key}
                className={`group relative flex flex-col border-b border-outline-variant py-6 transition-colors duration-(--duration-medium2) ease-standard hover:bg-surface-container-low medium:px-5 large:border-b-0 ${i % 2 === 1 ? "medium:border-l" : ""} ${i > 0 ? "large:border-l" : ""}`}
              >
                <div className="flex items-start justify-between gap-4 medium:block">
                  <div className="min-w-0">
                    <p className="text-label-lg font-medium text-primary">{c.label}</p>
                    <h3 className="mt-1 max-w-[260px] text-title-lg text-pretty text-on-surface">
                      <Link href={c.href} className="rounded-xs outline-offset-4 after:absolute after:inset-0 after:content-['']">
                        {c.title}
                      </Link>
                    </h3>
                  </div>
                  <Art className="w-28 shrink-0 transition-transform duration-(--duration-long2) ease-(--ease-emphasized-decelerate) group-hover:-translate-y-1 medium:mt-4 medium:w-40" />
                </div>
                {c.types.length > 0 && (
                  <ul className="relative z-[1] mt-4 flex flex-wrap gap-1.5" aria-label={`${c.label} shortcuts`}>
                    {c.types.map((t) => (
                      <li key={t.label}>
                        <Link
                          href={t.href}
                          className="state-layer inline-flex h-8 items-center rounded-sm border border-outline-variant bg-surface px-3 text-label-lg text-on-surface-variant hover:text-on-surface"
                        >
                          {t.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-5 text-label-lg font-medium text-on-surface-variant group-hover:text-primary">
                  {c.cta}
                  <Icon icon={arrowForwardIcon} size={18} className="transition-transform duration-(--duration-medium2) ease-standard group-hover:translate-x-1" />
                </span>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
