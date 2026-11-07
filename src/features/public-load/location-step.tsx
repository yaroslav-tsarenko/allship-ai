"use client";

import { useState } from "react";
import { get, useFormContext, useWatch } from "react-hook-form";
import { Icon } from "@/components/ui/icon";
import { locationOnIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { addDays, MAX_DAYS_AHEAD } from "@/features/loads/route-rules";
import { useLiveRevalidation } from "@/features/loads/live-validation";
import { StopLocationFields } from "@/features/location/location-field";
import { todayIso, type PublicLoadValues } from "./model";
import { milesBetween, type ZipPlace } from "./zip";

type Prefix = "pickup" | "dropoff";

function StopFields({ prefix, minDate, maxDate, onZip }: { prefix: Prefix; minDate: string; maxDate: string; onZip: (place: ZipPlace | null) => void }) {
  const { register, formState } = useFormContext<PublicLoadValues>();
  const err = (k: string) => get(formState.errors, `${prefix}.${k}`)?.message as string | undefined;
  const pickup = prefix === "pickup";
  const noun = pickup ? "pickup" : "delivery";

  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-5 flex items-center gap-2 text-title-lg text-on-surface">
        <Icon icon={pickup ? tripOriginIcon : locationOnIcon} size={22} filled className={pickup ? "text-primary" : "text-tertiary"} />
        {pickup ? "Pickup" : "Delivery"}
      </legend>
      <StopLocationFields prefix={prefix} label={`${pickup ? "Pickup" : "Delivery"} address`} addressRequired={false} addressHelp="Optional now. Only the carrier you book sees it." onZip={onZip} />
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
        <TextField label={`${pickup ? "Pickup" : "Delivery"} date`} type="date" required min={minDate} max={maxDate} supportingText={pickup ? "First day the load is ready" : "First day someone can receive it"} error={err("windowStart")} {...register(`${prefix}.windowStart`)} />
        <TextField label={`Latest ${noun} date`} type="date" min={minDate} max={maxDate} supportingText="Optional. A wider window gets more bids." error={err("windowEnd")} {...register(`${prefix}.windowEnd`)} />
      </div>
    </fieldset>
  );
}

export function LocationStep() {
  const { control } = useFormContext<PublicLoadValues>();
  const today = todayIso();
  const maxDate = addDays(today, MAX_DAYS_AHEAD);
  useLiveRevalidation("pickup", "dropoff");
  const pickupDate = useWatch({ control, name: "pickup.windowStart" });
  const [from, setFrom] = useState<ZipPlace | null>(null);
  const [to, setTo] = useState<ZipPlace | null>(null);
  const miles = from && to ? Math.round(milesBetween(from, to)) : null;

  return (
    <div className="flex flex-col gap-10">
      <StopFields prefix="pickup" minDate={today} maxDate={maxDate} onZip={setFrom} />
      <div className="relative border-t border-outline-variant">
        {miles !== null && miles > 0 && (
          <p className="absolute top-0 left-0 -translate-y-1/2 bg-surface pr-3 text-label-lg text-on-surface-variant" aria-live="polite">
            About {miles.toLocaleString("en-US")} miles apart in a straight line
          </p>
        )}
      </div>
      <StopFields prefix="dropoff" minDate={pickupDate && pickupDate >= today ? pickupDate : today} maxDate={addDays(maxDate, 60)} onZip={setTo} />
    </div>
  );
}
