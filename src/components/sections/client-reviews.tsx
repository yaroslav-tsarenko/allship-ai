import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { openInNewIcon, starIcon, verifiedIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { getPlatformReviews, getReviewSummary, getTestimonials, type PublicTestimonial } from "@/server/showcase/queries";
import { SectionHeader } from "./section-header";
import { sectionId } from "./types";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex text-primary" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} icon={starIcon} filled={n <= rating} size={18} className={n <= rating ? "" : "text-outline-variant"} />
      ))}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

function ReviewCard({ item, featured }: { item: PublicTestimonial; featured: boolean }) {
  return (
    <li className={cn("flex flex-col rounded-xl p-6 medium:p-8", featured ? "bg-primary-container text-on-primary-container large:col-span-2 large:row-span-2" : "bg-surface-container-low text-on-surface")}>
      {item.rating ? <Stars rating={item.rating} /> : null}
      <blockquote className={cn("mt-4 flex-1 text-pretty", featured ? "text-headline-sm medium:text-headline-md" : "text-body-xl")}>
        <p>&ldquo;{item.quote}&rdquo;</p>
      </blockquote>
      <footer className="mt-6 flex flex-col gap-1">
        <span className="text-title-md">{item.authorName}</span>
        {item.authorDetail && <span className={cn("text-body-md", featured ? "text-on-primary-container/80" : "text-on-surface-variant")}>{item.authorDetail}</span>}
        <span className={cn("mt-2 inline-flex flex-wrap items-center gap-1.5 text-body-sm", featured ? "text-on-primary-container/80" : "text-on-surface-variant")}>
          {item.kind === "platform" && <Icon icon={verifiedIcon} size={16} className="text-primary" />}
          {item.sourceUrl ? (
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
              {item.sourceLabel}
              <Icon icon={openInNewIcon} size={14} />
            </a>
          ) : (
            <span>{item.sourceLabel}</span>
          )}
          {item.reviewedAt && <span>· {dateFormat.format(new Date(item.reviewedAt))}</span>}
        </span>
      </footer>
    </li>
  );
}

export async function ClientReviews({
  placement,
  title = "What Our Clients Say",
  description,
  includePlatformReviews = true,
  limit = 5,
  id,
}: {
  placement: string;
  title?: string;
  description?: string;
  includePlatformReviews?: boolean;
  limit?: number;
  id?: string;
}) {
  const [curated, platform, summary] = await Promise.all([
    getTestimonials(placement, limit),
    includePlatformReviews ? getPlatformReviews(limit) : Promise.resolve([]),
    includePlatformReviews ? getReviewSummary() : Promise.resolve({ count: 0, average: null }),
  ]);
  const items = [...curated, ...platform].slice(0, limit);
  if (!items.length) return null;
  const headingId = id ?? sectionId("reviews", title);
  const summaryText = summary.count >= 3 && summary.average ? `${summary.average.toFixed(1)} out of 5 from ${summary.count} verified shipper reviews on AllShip AI.` : undefined;
  return (
    <section aria-labelledby={headingId} className="py-16 medium:py-24">
      <Container>
        <SectionHeader id={headingId} title={title} description={description ?? summaryText} className="mb-10" />
        <ul className={cn("grid gap-4", items.length === 1 && "max-w-[760px]", items.length === 2 && "medium:grid-cols-2", items.length >= 3 && "medium:grid-cols-2 large:grid-cols-4")}>
          {items.map((item, i) => (
            <ReviewCard key={item.id} item={item} featured={i === 0 && items.length > 2} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
