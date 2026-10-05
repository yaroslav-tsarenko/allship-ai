import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { RateCardEditor } from "@/features/pricing/rate-card-editor";
import { env } from "@/env";
import { db } from "@/server/db/client";
import { carrierProfile, carrierRateTier, carrierServiceRates } from "@/server/db/schema";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Instant quote rates" };

export default async function PricingSettingsPage() {
  const viewer = await getViewer();
  if (!viewer.org || (viewer.role !== "owner" && viewer.role !== "dispatcher")) redirect("/app/settings");
  const orgId = viewer.org.orgId;
  if (!orgId) redirect("/app/settings");
  const [[profile], tiers, [rates]] = await Promise.all([
    db
      .select({ instantQuotes: carrierProfile.instantQuotes, minMiles: carrierProfile.instantQuoteMinMiles, maxMiles: carrierProfile.instantQuoteMaxMiles, serviceStates: carrierProfile.serviceStates, fmcsaStatus: carrierProfile.fmcsaStatus })
      .from(carrierProfile)
      .where(eq(carrierProfile.orgId, orgId))
      .limit(1),
    db.select({ fromMiles: carrierRateTier.fromMiles, toMiles: carrierRateTier.toMiles, ratePerCuFtCents: carrierRateTier.ratePerCuFtCents }).from(carrierRateTier).where(eq(carrierRateTier.orgId, orgId)).orderBy(asc(carrierRateTier.fromMiles)),
    db.select().from(carrierServiceRates).where(eq(carrierServiceRates.orgId, orgId)).limit(1),
  ]);
  if (!profile) redirect("/app/onboarding");
  const listed = profile.fmcsaStatus === "verified" || (env.NODE_ENV !== "production" && process.env.ALLOW_UNVERIFIED_CARRIERS === "1");

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <div>
        <Link href="/app/settings" className="state-layer -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-lg font-medium text-on-surface-variant">
          <Icon icon={arrowBackIcon} size={20} />
          Settings
        </Link>
        <PageHeader
          title="Instant quote rates"
          description="Shippers on the moving page see a price built from these rates and can book you right away. You get a bid at that price and 24 hours to withdraw it."
        />
      </div>
      <RateCardEditor
        feePercent={env.PLATFORM_FEE_BPS / 100}
        listed={listed}
        initial={{
          instantQuotes: profile.instantQuotes,
          minMiles: profile.minMiles,
          maxMiles: profile.maxMiles,
          serviceStates: profile.serviceStates,
          tiers,
          packingPerCuFtCents: rates?.packingPerCuFtCents ?? 0,
          unpackingPerCuFtCents: rates?.unpackingPerCuFtCents ?? 0,
          storagePerCuFtMonthCents: rates?.storagePerCuFtMonthCents ?? 0,
        }}
      />
    </div>
  );
}
