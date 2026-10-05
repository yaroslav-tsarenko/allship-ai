import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { rateReviewIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { requireCarrierStaff } from "@/features/board/eligibility";
import { ReplyForm } from "@/features/reviews/reply-form";
import { Stars } from "@/features/reviews/stars";
import { reviewsForCarrier } from "@/server/reviews/service";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Reviews" };

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ReviewsPage() {
  const viewer = await getViewer();
  const org = requireCarrierStaff(viewer);
  const { average, total, reviews } = await reviewsForCarrier(org.orgId!);
  const complete = reviews.length === total;
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));
  const unanswered = reviews.filter((r) => !r.carrierReply).length;

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader title="Reviews" description={`What shippers say about ${org.orgName}. Replies are public.`} />
      {total === 0 ? (
        <EmptyState
          icon={rateReviewIcon}
          title="No reviews yet"
          description="Shippers can leave a review after a load is complete. Reviews show next to your bids, so on-time pickups and clear updates pay off."
        />
      ) : (
        <Reveal stagger={0.06} className="flex flex-col gap-6">
          <Card as="section" aria-labelledby="summary-title" className="grid gap-6 p-5 medium:grid-cols-[auto_minmax(0,1fr)] medium:gap-10 medium:p-6">
            <h2 id="summary-title" className="sr-only">
              Rating summary
            </h2>
            <div className="flex flex-col gap-1">
              <p className="text-display-md text-on-surface tabular-nums">{average ? average.toFixed(1) : "–"}</p>
              <Stars value={average ?? 0} size={22} />
              <p className="text-body-md text-on-surface-variant">
                {total} {total === 1 ? "review" : "reviews"}
                {unanswered > 0 ? ` · ${unanswered} without a reply` : ""}
              </p>
            </div>
            {complete && (
              <dl className="flex flex-col justify-center gap-1.5">
                {distribution.map((d) => (
                  <div key={d.stars} className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-body-sm">
                    <dt className="text-on-surface-variant">{d.stars} stars</dt>
                    <dd className="h-2 overflow-hidden rounded-full bg-surface-container-highest">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${total ? (d.count / total) * 100 : 0}%` }} />
                    </dd>
                    <dd className="text-right text-on-surface-variant tabular-nums">{d.count}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card as="section" aria-labelledby="list-title" className="overflow-hidden">
            <h2 id="list-title" className="px-5 pt-5 pb-3 text-title-lg medium:px-6">
              {complete ? "All reviews" : `Latest ${reviews.length} reviews`}
            </h2>
            <ul>
              {reviews.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 border-t border-outline-variant px-5 py-4 medium:px-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} />
                    <span className="text-title-sm text-on-surface">{r.shipperFirstName ?? "A shipper"}</span>
                    <span className="text-body-sm text-on-surface-variant">{dateFmt.format(r.createdAt)}</span>
                  </div>
                  <Link href={`/app/trips/${r.loadPublicId}`} className="self-start rounded-xs text-body-sm text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline">
                    {r.loadTitle} · {r.loadPublicId}
                  </Link>
                  {r.body ? <p className="text-body-lg whitespace-pre-line text-on-surface">{r.body}</p> : <p className="text-body-md text-on-surface-variant">No written comment.</p>}
                  {r.carrierReply && (
                    <div className="mt-1 border-l-2 border-primary pl-4">
                      <p className="text-label-lg text-on-surface-variant">
                        Your reply{r.carrierRepliedAt ? ` · ${dateFmt.format(r.carrierRepliedAt)}` : ""}
                      </p>
                      <p className="mt-0.5 text-body-md whitespace-pre-line text-on-surface">{r.carrierReply}</p>
                    </div>
                  )}
                  <ReplyForm reviewId={r.id} existing={r.carrierReply} />
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
