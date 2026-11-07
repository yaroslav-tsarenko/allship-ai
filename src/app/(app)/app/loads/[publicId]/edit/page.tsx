import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon } from "@/components/ui/icons.generated";
import { requireShipper } from "@/features/loads/guard";
import { LoadWizard } from "@/features/loads/load-wizard";
import { detailsFor, emptyStop, type StopValues, type WizardValues } from "@/features/loads/wizard-model";
import { getShipperLoad } from "@/server/loads/service";

export const metadata: Metadata = { title: "Edit draft" };

type Props = { params: Promise<{ publicId: string }> };

const textKeys = ["address", "city", "state", "postalCode", "windowStart", "windowEnd", "notes"] as const;

const toStop = (s: Partial<Record<keyof StopValues, unknown>>): StopValues => {
  const base = emptyStop();
  for (const k of textKeys) base[k] = typeof s[k] === "string" ? (s[k] as string) : "";
  if (typeof s.lat === "number" && typeof s.lng === "number") Object.assign(base, { lat: s.lat, lng: s.lng });
  if (typeof s.placeId === "string") base.placeId = s.placeId;
  return base;
};

export default async function EditLoadPage({ params }: Props) {
  const { publicId } = await params;
  const { actor } = await requireShipper(publicId);
  const data = await getShipperLoad(actor, publicId);
  if (!data) notFound();
  const l = data.load;
  if (l.status !== "draft") redirect(`/app/loads/${l.publicId}`);
  const { notes, ...details } = (l.details ?? {}) as Record<string, unknown>;
  const initial: WizardValues = {
    category: l.category,
    details: detailsFor(l.category, details),
    pickup: toStop(l.pickup),
    dropoff: toStop(l.dropoff),
    title: l.title,
    notes: typeof notes === "string" ? notes : "",
    targetPrice: l.targetPriceCents ? String(l.targetPriceCents / 100) : "",
    biddingDays: "5",
  };
  return (
    <div className="mx-auto max-w-[960px]">
      <div className="flex items-center gap-2 pt-2 pb-6 medium:pt-4">
        <Link href={`/app/loads/${l.publicId}`} aria-label="Back to load" className="state-layer -ml-2 inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant">
          <Icon icon={arrowBackIcon} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-headline-md text-on-surface medium:text-headline-lg">Finish your draft</h1>
          <p className="font-mono text-label-lg text-on-surface-variant">{l.publicId}</p>
        </div>
      </div>
      <LoadWizard initial={initial} loadId={l.id} initialStep={3} />
    </div>
  );
}
