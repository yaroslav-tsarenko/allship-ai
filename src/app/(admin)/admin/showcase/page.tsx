import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ShowcaseManager } from "@/features/admin/showcase/showcase-manager";
import type { PlacementKey } from "@/features/admin/showcase/schema";
import { requireAdmin } from "@/server/auth/session";
import { listShowcase } from "@/server/showcase/admin";

export const metadata: Metadata = { title: "Reviews and logos" };

export default async function ShowcasePage() {
  await requireAdmin();
  const { testimonials, logos } = await listShowcase();
  return (
    <div>
      <PageHeader title="Reviews and logos" description="Customer reviews and partner logos shown on the public site. Only genuine, verifiable reviews and logos of real partners may be published." />
      <ShowcaseManager
        testimonials={testimonials.map((t) => ({
          id: t.id,
          quote: t.quote,
          authorName: t.authorName,
          authorDetail: t.authorDetail,
          rating: t.rating,
          sourceLabel: t.sourceLabel,
          sourceUrl: t.sourceUrl,
          reviewedAt: t.reviewedAt ? t.reviewedAt.toISOString().slice(0, 10) : null,
          audience: t.audience,
          placements: t.placements as PlacementKey[],
          published: t.published,
          sort: t.sort,
        }))}
        logos={logos.map((l) => ({ id: l.id, name: l.name, imageUrl: l.imageKey, href: l.href, relationship: l.relationship, published: l.published, sort: l.sort }))}
      />
    </div>
  );
}
