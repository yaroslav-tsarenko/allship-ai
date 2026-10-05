"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Icon } from "@/components/ui/icon";
import { locationOnIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { US_STATES } from "@/features/loads/schema";
import { publicEnv } from "@/lib/public-env";
import { todayIso, type PublicLoadValues } from "./model";
import { lookupZip, milesBetween, type ZipPlace } from "./zip";

const AddressAutocomplete = dynamic(() => import("./address-autocomplete"), { ssr: false });

const stateOptions = US_STATES.map(([value, name]) => ({ value, label: `${name} (${value})` }));
const mapsKey = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

type Prefix = "pickup" | "dropoff";

function StopFields({ prefix, minDate, onZip }: { prefix: Prefix; minDate: string; onZip: (place: ZipPlace | null) => void }) {
  const { register, control, setValue, getValues, formState } = useFormContext<PublicLoadValues>();
  const err = (k: string) => get(formState.errors, `${prefix}.${k}`)?.message as string | undefined;
  const zip = useWatch({ control, name: `${prefix}.postalCode` });
  const [zipNote, setZipNote] = useState<string | null>(null);
  const autoFilled = useRef<{ city: string; state: string } | null>(null);
  const pickup = prefix === "pickup";
  const noun = pickup ? "pickup" : "delivery";

  useEffect(() => {
    let cancelled = false;
    if (!/^\d{5}$/.test(zip ?? "")) {
      const id = window.setTimeout(() => {
        setZipNote(null);
        onZip(null);
      }, 0);
      return () => window.clearTimeout(id);
    }
    lookupZip(zip).then((place) => {
      if (cancelled) return;
      onZip(place);
      if (!place) {
        setZipNote("We don't recognize this ZIP. Check it, or enter the city and state yourself.");
        return;
      }
      const city = getValues(`${prefix}.city`).trim();
      const state = getValues(`${prefix}.state`);
      const untouched = !city || (autoFilled.current && autoFilled.current.city === city && autoFilled.current.state === state);
      if (untouched) {
        setValue(`${prefix}.city`, place.city, { shouldValidate: formState.isSubmitted, shouldDirty: true });
        setValue(`${prefix}.state`, place.state, { shouldValidate: formState.isSubmitted, shouldDirty: true });
        autoFilled.current = { city: place.city, state: place.state };
      }
      setZipNote(`${place.city}, ${place.state}`);
    });
    return () => {
      cancelled = true;
    };
  }, [zip, prefix, getValues, setValue, onZip, formState.isSubmitted]);

  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-5 flex items-center gap-2 text-title-lg text-on-surface">
        <Icon icon={pickup ? tripOriginIcon : locationOnIcon} size={22} filled className={pickup ? "text-primary" : "text-tertiary"} />
        {pickup ? "Pickup" : "Delivery"}
      </legend>
      {mapsKey && (
        <Controller
          control={control}
          name={`${prefix}.address`}
          render={({ field }) => (
            <AddressAutocomplete
              apiKey={mapsKey}
              label={`${pickup ? "Pickup" : "Delivery"} address`}
              supportingText="Start typing and pick your address, or fill in ZIP, city and state below."
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              error={err("address")}
              onPick={(p) => {
                field.onChange(p.address);
                if (p.postalCode) setValue(`${prefix}.postalCode`, p.postalCode, { shouldDirty: true });
                if (p.city) setValue(`${prefix}.city`, p.city, { shouldDirty: true });
                if (p.state) setValue(`${prefix}.state`, p.state, { shouldDirty: true });
                setValue(`${prefix}.lat`, p.lat);
                setValue(`${prefix}.lng`, p.lng);
                setValue(`${prefix}.placeId`, p.placeId);
                autoFilled.current = { city: p.city, state: p.state };
              }}
            />
          )}
        />
      )}
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-[132px_minmax(0,1fr)_minmax(0,1fr)]">
        <TextField
          label="ZIP code"
          required
          inputMode="numeric"
          autoComplete={`section-${prefix} postal-code`}
          maxLength={5}
          error={err("postalCode")}
          supportingText={zipNote ?? undefined}
          {...register(`${prefix}.postalCode`, {
            setValueAs: (v: string) => String(v ?? "").replace(/\D/g, "").slice(0, 5),
          })}
        />
        <TextField label="City" required autoComplete={`section-${prefix} address-level2`} error={err("city")} {...register(`${prefix}.city`)} />
        <SelectField label="State" required options={stateOptions} placeholder="Choose a state" autoComplete={`section-${prefix} address-level1`} error={err("state")} {...register(`${prefix}.state`)} />
      </div>
      {!mapsKey && (
        <TextField
          label={`${pickup ? "Pickup" : "Delivery"} street address`}
          autoComplete={`section-${prefix} street-address`}
          supportingText="Optional now. Only the carrier you book sees it."
          error={err("address")}
          {...register(`${prefix}.address`)}
        />
      )}
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
        <TextField label={`${pickup ? "Pickup" : "Delivery"} date`} type="date" required min={minDate} error={err("windowStart")} {...register(`${prefix}.windowStart`)} />
        <TextField label={`Latest ${noun} date`} type="date" min={minDate} supportingText="Optional. A wider window gets more bids." error={err("windowEnd")} {...register(`${prefix}.windowEnd`)} />
      </div>
    </fieldset>
  );
}

export function LocationStep() {
  const { control } = useFormContext<PublicLoadValues>();
  const today = todayIso();
  const pickupDate = useWatch({ control, name: "pickup.windowStart" });
  const [from, setFrom] = useState<ZipPlace | null>(null);
  const [to, setTo] = useState<ZipPlace | null>(null);
  const miles = from && to ? Math.round(milesBetween(from, to)) : null;

  return (
    <div className="flex flex-col gap-10">
      <StopFields prefix="pickup" minDate={today} onZip={setFrom} />
      <div className="relative border-t border-outline-variant">
        {miles !== null && miles > 0 && (
          <p className="absolute top-0 left-0 -translate-y-1/2 bg-surface pr-3 text-label-lg text-on-surface-variant" aria-live="polite">
            About {miles.toLocaleString("en-US")} miles apart in a straight line
          </p>
        )}
      </div>
      <StopFields prefix="dropoff" minDate={pickupDate && pickupDate >= today ? pickupDate : today} onZip={setTo} />
    </div>
  );
}
