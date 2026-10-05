"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoDialog, emptyLogo, type LogoRow } from "./logo-form";
import { SHOWCASE_PLACEMENTS } from "./schema";
import { TestimonialDialog, emptyTestimonial, type TestimonialRow } from "./testimonial-form";

const placementLabel = (key: string) => SHOWCASE_PLACEMENTS.find((p) => p.value === key)?.label ?? key;

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={published ? "rounded-xs bg-success-container px-2 py-0.5 text-label-md text-on-success-container" : "rounded-xs bg-surface-container-highest px-2 py-0.5 text-label-md text-on-surface-variant"}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function ShowcaseManager({ testimonials, logos }: { testimonials: TestimonialRow[]; logos: LogoRow[] }) {
  const [review, setReview] = useState<{ row: TestimonialRow; key: number } | null>(null);
  const [logo, setLogo] = useState<{ row: LogoRow; key: number } | null>(null);

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="reviews-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="reviews-title" className="text-title-lg">
              Customer reviews
            </h2>
            <p className="text-body-md text-on-surface-variant">Shown in the “What Our Clients Say” block on the pages you pick, next to verified reviews left on the platform.</p>
          </div>
          <Button onClick={() => setReview({ row: emptyTestimonial, key: Date.now() })}>Add review</Button>
        </div>
        {testimonials.length === 0 ? (
          <p className="rounded-md bg-surface-container-low p-6 text-body-md text-on-surface-variant">No reviews yet. The reviews block stays hidden on the site until there is at least one published review.</p>
        ) : (
          <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant">
            {testimonials.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setReview({ row: t, key: Date.now() })} className="state-layer flex w-full flex-col gap-2 p-4 text-left">
                  <span className="flex flex-wrap items-center gap-2">
                    <StatusBadge published={t.published} />
                    <span className="text-title-sm">{t.authorName}</span>
                    {t.rating && <span className="text-body-sm text-on-surface-variant">{t.rating}/5</span>}
                    <span className="text-body-sm text-on-surface-variant">· {t.sourceLabel}</span>
                  </span>
                  <span className="line-clamp-2 text-body-md text-on-surface-variant">{t.quote}</span>
                  <span className="text-body-sm text-on-surface-variant">{t.placements.length ? t.placements.map(placementLabel).join(", ") : "No pages selected"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="logos-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="logos-title" className="text-title-lg">
              Partner and customer logos
            </h2>
            <p className="text-body-md text-on-surface-variant">Shown in the logos block. It stays hidden while no logo is published.</p>
          </div>
          <Button onClick={() => setLogo({ row: emptyLogo, key: Date.now() })}>Add logo</Button>
        </div>
        {logos.length === 0 ? (
          <p className="rounded-md bg-surface-container-low p-6 text-body-md text-on-surface-variant">No logos yet.</p>
        ) : (
          <ul className="grid gap-3 medium:grid-cols-2 large:grid-cols-4">
            {logos.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => setLogo({ row: l, key: Date.now() })} className="state-layer flex w-full flex-col items-start gap-3 rounded-md border border-outline-variant p-4 text-left">
                  <span className="flex h-12 w-full items-center">
                    <Image src={l.imageUrl} alt="" width={160} height={48} unoptimized className="max-h-full w-auto max-w-[160px] object-contain" />
                  </span>
                  <span className="text-title-sm">{l.name}</span>
                  <span className="text-body-sm text-on-surface-variant">{l.relationship}</span>
                  <StatusBadge published={l.published} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {review && <TestimonialDialog key={review.key} initial={review.row} open onOpenChange={(o) => !o && setReview(null)} />}
      {logo && <LogoDialog key={logo.key} initial={logo.row} open onOpenChange={(o) => !o && setLogo(null)} />}
    </div>
  );
}
