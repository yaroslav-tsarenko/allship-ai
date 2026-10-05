import { and, eq, or } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { locationOnIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { categoryIcons, formatWindow, timeLeft } from "@/features/loads/presentation";
import { describeDetail, loadSpecs } from "@/features/loads/spec";
import { BidCta } from "@/features/public-load/bid-cta";
import { buildMetadata } from "@/lib/seo";
import { db } from "@/server/db/client";
import { legacyMap, load } from "@/server/db/schema";
import { categoryLabel, getPublicLoad } from "@/server/loads/service";
import { statusLabels } from "@/server/loads/transitions";

export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ loadId: string }> };

const publicIdPattern = /^AS-[23456789A-HJ-NP-Z]{6}$/;
const mongoIdPattern = /^[a-f0-9]{24}$/i;

const findLoad = cache(async (raw: string) => {
  const id = decodeURIComponent(raw).trim();
  if (publicIdPattern.test(id.toUpperCase())) return { load: await getPublicLoad(id.toUpperCase()), redirectTo: null };
  if (mongoIdPattern.test(id)) {
    const [mapped] = await db.select({ newId: legacyMap.newId }).from(legacyMap).where(and(or(eq(legacyMap.collection, "loads"), eq(legacyMap.collection, "load")), eq(legacyMap.mongoId, id.toLowerCase()))).limit(1);
    const [row] = await db
      .select({ publicId: load.publicId })
      .from(load)
      .where(mapped ? or(eq(load.publicId, mapped.newId), eq(load.legacyId, id.toLowerCase())) : eq(load.legacyId, id.toLowerCase()))
      .limit(1);
    return { load: null, redirectTo: row?.publicId ?? null };
  }
  return { load: null, redirectTo: null };
});

function biddingState(status: string, closesAt: Date | null) {
  const open = status === "open" && Boolean(closesAt && closesAt.getTime() > Date.now());
  return { open, left: open ? timeLeft(closesAt) : null };
}

const place = (city: string | null, state: string | null) => [city, state].filter(Boolean).join(", ") || "Location on file";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { loadId } = await params;
  const { load: l } = await findLoad(loadId);
  if (!l || l.status === "draft") return { title: "Load not found", robots: { index: false, follow: false } };
  const route = `${place(l.pickupCity, l.pickupState)} to ${place(l.dropoffCity, l.dropoffState)}`;
  return buildMetadata({
    title: `${l.title} · ${l.publicId}`,
    description: `${categoryLabel(l.category)} load from ${route}. ${l.status === "open" ? "Open for bids from verified carriers on AllShip AI." : "Bidding on this load is closed."}`,
    path: `/load/${l.publicId}`,
    noindex: l.status !== "open",
  });
}

export default async function PublicLoadPage({ params }: Props) {
  const { loadId } = await params;
  const { load: l, redirectTo } = await findLoad(loadId);
  if (redirectTo) permanentRedirect(`/load/${redirectTo}`);
  if (!l || l.status === "draft") notFound();
  if (l.publicId !== decodeURIComponent(loadId)) permanentRedirect(`/load/${l.publicId}`);

  const { open, left } = biddingState(l.status, l.biddingClosesAt);
  const details = (l.details ?? {}) as Record<string, unknown>;
  const sections = loadSpecs[l.category]
    .map((s) => ({ title: s.title, rows: s.fields.map((f) => ({ label: f.label, value: describeDetail(f, details[f.name]) })).filter((r): r is { label: string; value: string } => Boolean(r.value)) }))
    .filter((s) => s.rows.length > 0);
  const stops = [
    { kind: "pickup" as const, label: "Pickup", city: l.pickupCity, state: l.pickupState, zip: l.pickupZip, window: formatWindow({ windowStart: l.pickupDate, windowEnd: l.pickupEnd ?? undefined }) },
    { kind: "dropoff" as const, label: "Delivery", city: l.dropoffCity, state: l.dropoffState, zip: l.dropoffZip, window: formatWindow({ windowStart: l.dropoffDate, windowEnd: l.dropoffEnd ?? undefined }) },
  ];

  return (
    <Container className="pt-6 pb-16 medium:pb-24">
      <Breadcrumbs items={[{ name: "Load board", path: "/loads" }, { name: l.publicId, path: `/load/${l.publicId}` }]} />
      <div className="mt-8 grid gap-10 medium:mt-12 expanded:grid-cols-[minmax(0,1fr)_minmax(0,360px)] expanded:gap-16">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label-lg text-on-surface-variant">
            <span className="font-mono">Load ID {l.publicId}</span>
            <span aria-hidden="true">·</span>
            <span className={open ? "text-primary" : undefined}>{open ? "Open for bids" : l.status === "open" ? "Bidding closed" : statusLabels[l.status]}</span>
          </p>
          <h1 className="mt-3 text-display-sm font-normal text-balance text-on-surface">{l.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-body-lg text-on-surface-variant">
            <Icon icon={categoryIcons[l.category]} size={20} />
            {categoryLabel(l.category)}
          </p>

          <section aria-labelledby="route-heading" className="mt-12">
            <h2 id="route-heading" className="text-title-lg text-on-surface">
              Route
            </h2>
            <ol className="relative mt-5 flex flex-col gap-8">
              <span aria-hidden="true" className="absolute top-8 bottom-8 left-[11px] w-0.5 rounded-full bg-outline-variant" />
              {stops.map((s) => (
                <li key={s.kind} className="relative flex gap-4">
                  <Icon icon={s.kind === "pickup" ? tripOriginIcon : locationOnIcon} size={24} filled className={s.kind === "pickup" ? "shrink-0 text-primary" : "shrink-0 text-tertiary"} />
                  <div className="min-w-0">
                    <p className="text-label-lg text-on-surface-variant">{s.label}</p>
                    <p className="mt-0.5 text-title-lg text-on-surface">{place(s.city, s.state)}</p>
                    <p className="text-body-md text-on-surface-variant">
                      {s.zip ? `ZIP ${s.zip}xx · ` : ""}
                      {s.window}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {sections.length > 0 && (
            <section aria-labelledby="details-heading" className="mt-12">
              <h2 id="details-heading" className="text-title-lg text-on-surface">
                Details
              </h2>
              <div className="mt-5 grid gap-x-10 gap-y-8 medium:grid-cols-2">
                {sections.map((s) => (
                  <div key={s.title}>
                    <h3 className="text-label-lg text-on-surface-variant">{s.title}</h3>
                    <dl className="mt-2 border-t border-outline-variant">
                      {s.rows.map((r) => (
                        <div key={r.label} className="flex justify-between gap-6 border-b border-outline-variant py-2.5 text-body-md">
                          <dt className="text-on-surface-variant">{r.label}</dt>
                          <dd className="text-right text-on-surface">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="mt-10 max-w-[62ch] text-body-md text-pretty text-on-surface-variant">
            Street addresses, the shipper&rsquo;s notes and contact details are shared only with signed-in carriers and the carrier the shipper books. Read more about{" "}
            <Link href="/safety" className="text-primary underline-offset-2 hover:underline">
              safety and privacy
            </Link>
            .
          </p>
        </div>

        <aside aria-label="Bidding" className="flex flex-col gap-6 expanded:sticky expanded:top-24 expanded:self-start">
          <div className="rounded-lg bg-surface-container-low p-6">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-label-lg text-on-surface-variant">Bids so far</dt>
                <dd className="mt-1 text-headline-sm text-on-surface tabular-nums">{l.bids}</dd>
              </div>
              <div>
                <dt className="text-label-lg text-on-surface-variant">Bidding</dt>
                <dd className="mt-1 text-title-md text-on-surface">{open ? left : "Closed"}</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-outline-variant pt-6">
              <BidCta publicId={l.publicId} open={open} />
            </div>
          </div>
          <p className="px-2 text-body-md text-pretty text-on-surface-variant">
            Shipping something similar?{" "}
            <Link href="/quote" className="text-primary underline-offset-2 hover:underline">
              Post your own load
            </Link>{" "}
            and get bids from verified carriers.
          </p>
        </aside>
      </div>
    </Container>
  );
}
