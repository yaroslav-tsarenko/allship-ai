"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { US_STATES } from "@/features/loads/states";
import { lookupZip, type ZipPlace } from "@/features/public-load/zip";
import { loadPlaces, type PlaceHit, type Suggestion } from "./google-places";
import type { LocalPlace } from "./local-places";
import { googleFooter, mapsKey, SuggestionRow, useGoogleAvailable, useGoogleSuggestions, useLocalSuggestions } from "./place-search";

const stateOptions = US_STATES.map(([value, name]) => ({ value, label: `${name} (${value})` }));
const RESERVE = "\u00a0";

type StopKey = "address" | "city" | "state" | "postalCode";

export function formatStop(s: { address?: string; city?: string; state?: string; postalCode?: string }) {
  const tail = [s.state, s.postalCode].filter(Boolean).join(" ");
  return [s.address, s.city, tail].filter(Boolean).join(", ");
}

export function StopLocationFields({
  prefix,
  label,
  addressRequired,
  addressHelp = "Only the carrier you book sees the street address.",
  onZip,
}: {
  prefix: "pickup" | "dropoff";
  label: string;
  addressRequired: boolean;
  addressHelp?: string;
  onZip?: (place: ZipPlace | null) => void;
}) {
  const { register, control, setValue, getValues, formState, setFocus } = useFormContext();
  const google = useGoogleAvailable();
  const path = (k: string) => `${prefix}.${k}`;
  const err = (k: StopKey) => get(formState.errors, path(k))?.message as string | undefined;
  const [manual, setManual] = useState(() => !google || (Boolean(getValues(path("postalCode"))) && !getValues(path("placeId"))));
  const [query, setQuery] = useState(() => formatStop(getValues(prefix) ?? {}));
  const [typed, setTyped] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [zipNote, setZipNote] = useState<string | null>(null);
  const autoFilled = useRef<{ city: string; state: string } | null>(null);
  const pickedZip = useRef<string | null>(null);
  const zip = useWatch({ control, name: path("postalCode") }) as string | undefined;
  const city = useWatch({ control, name: path("city") }) as string | undefined;
  const searchMode = google && !manual;
  const remote = useGoogleSuggestions(query, searchMode && typed, false);
  const local = useLocalSuggestions(city ?? "", !searchMode && typed);
  const validate = formState.isSubmitted;

  useEffect(() => {
    let cancelled = false;
    if (!/^\d{5}$/.test(zip ?? "")) {
      const id = window.setTimeout(() => {
        setZipNote(null);
        onZip?.(null);
      }, 0);
      return () => window.clearTimeout(id);
    }
    if (pickedZip.current && pickedZip.current !== zip) {
      setValue(`${prefix}.placeId`, undefined);
      setValue(`${prefix}.lat`, undefined);
      setValue(`${prefix}.lng`, undefined);
      pickedZip.current = null;
    }
    lookupZip(zip!).then((place) => {
      if (cancelled) return;
      onZip?.(place);
      if (!place) {
        setZipNote("We don't recognize this ZIP. Check it, or enter the city and state yourself.");
        return;
      }
      const currentCity = String(getValues(`${prefix}.city`) ?? "").trim();
      const currentState = getValues(`${prefix}.state`);
      const untouched = !currentCity || (autoFilled.current && autoFilled.current.city === currentCity && autoFilled.current.state === currentState);
      if (untouched) {
        setValue(`${prefix}.city`, place.city, { shouldValidate: validate, shouldDirty: true });
        setValue(`${prefix}.state`, place.state, { shouldValidate: validate, shouldDirty: true });
        autoFilled.current = { city: place.city, state: place.state };
      }
      setZipNote(`${place.city}, ${place.state}`);
    });
    return () => {
      cancelled = true;
    };
  }, [zip, prefix, validate, getValues, setValue, onZip]);

  const applyHit = (hit: PlaceHit) => {
    const opts = { shouldValidate: validate, shouldDirty: true };
    setValue(path("address"), hit.address, opts);
    setValue(path("city"), hit.city, opts);
    setValue(path("state"), hit.state, opts);
    setValue(path("postalCode"), hit.postalCode, opts);
    setValue(path("lat"), hit.lat);
    setValue(path("lng"), hit.lng);
    setValue(path("placeId"), hit.placeId);
    autoFilled.current = { city: hit.city, state: hit.state };
    pickedZip.current = hit.postalCode || null;
    setQuery(formatStop(hit));
    setTyped(false);
    const missing = !hit.postalCode ? "postalCode" : !hit.city ? "city" : !hit.state ? "state" : addressRequired && !hit.address ? "address" : null;
    if (missing) {
      setManual(true);
      setNote(missing === "address" ? "That's a whole area. Add the street address so the carrier knows where to go." : "Google didn't return a full address. Add what's missing below.");
      window.setTimeout(() => setFocus(path(missing)), 50);
    } else setNote(null);
  };

  const searchError = err("postalCode") ?? err("city") ?? err("state") ?? err("address");
  const emptySearch = !getValues(path("postalCode")) && !getValues(path("city"));

  if (searchMode) {
    return (
      <div className="flex flex-col gap-1">
        <Combobox<Suggestion>
          label={label}
          required
          value={query}
          onInputChange={(v) => {
            setQuery(v);
            setTyped(true);
          }}
          onFocus={() => void loadPlaces(mapsKey)}
          onBlur={() => {
            if (emptySearch) return;
            if (query.trim() !== formatStop(getValues(prefix) ?? {})) setQuery(formatStop(getValues(prefix) ?? {}));
          }}
          items={remote.items}
          loading={remote.loading}
          minChars={3}
          itemKey={(s) => s.id}
          renderItem={(s) => <SuggestionRow main={s.main} secondary={s.secondary} />}
          onSelectItem={async (s) => {
            const hit = await remote.pick(s);
            if (hit) applyHit(hit);
            else {
              setManual(true);
              setNote("We couldn't load that address. Enter the ZIP code instead.");
            }
          }}
          emptyText="No matching US addresses. Check the spelling or use the ZIP code."
          listLabel={`${label} suggestions`}
          footer={googleFooter}
          supportingText={searchError ? undefined : "Start with the street number, then pick from the list."}
          error={searchError ? (emptySearch ? "Search for the address and pick it from the list" : searchError) : undefined}
          autoComplete="off"
        />
        <div>
          <Button type="button" variant="text" size="sm" className="-ml-3" onClick={() => setManual(true)}>
            Use ZIP code instead
          </Button>
        </div>
      </div>
    );
  }

  const cityField = (
    <Controller
      control={control}
      name={path("city")}
      render={({ field }) => (
        <Combobox<LocalPlace>
          label="City"
          required
          name={field.name}
          ref={field.ref}
          value={(field.value as string) ?? ""}
          onInputChange={(v) => {
            field.onChange(v);
            setTyped(true);
            autoFilled.current = null;
          }}
          onBlur={field.onBlur}
          items={local.items}
          loading={local.loading}
          minChars={2}
          itemKey={(p) => p.label}
          renderItem={(p) => p.label}
          onSelectItem={(p) => {
            const opts = { shouldValidate: validate, shouldDirty: true };
            field.onChange(p.city);
            setValue(path("state"), p.state, opts);
            if (p.postalCode) setValue(path("postalCode"), p.postalCode, opts);
            setTyped(false);
          }}
          listLabel="Matching cities"
          error={err("city")}
          supportingText={RESERVE}
        />
      )}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      {note && (
        <p role="status" className="rounded-sm bg-secondary-container px-4 py-3 text-body-md text-on-secondary-container">
          {note}
        </p>
      )}
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-[136px_minmax(0,1fr)_minmax(0,1fr)]">
        <TextField
          label="ZIP code"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={`section-${prefix} postal-code`}
          maxLength={5}
          error={err("postalCode")}
          supportingText={zipNote ?? "5 digits"}
          {...register(path("postalCode"), { setValueAs: (v: string) => String(v ?? "").replace(/\D/g, "").slice(0, 5) })}
        />
        {cityField}
        <SelectField label="State" required options={stateOptions} placeholder="Choose a state" autoComplete={`section-${prefix} address-level1`} error={err("state")} supportingText={RESERVE} {...register(path("state"))} />
      </div>
      <TextField
        label="Street address"
        required={addressRequired}
        autoComplete={`section-${prefix} street-address`}
        maxLength={200}
        supportingText={addressHelp}
        error={err("address")}
        {...register(path("address"))}
      />
      {google && (
        <div className="-mt-3">
          <Button
            type="button"
            variant="text"
            size="sm"
            className="-ml-3"
            onClick={() => {
              setQuery(formatStop(getValues(prefix) ?? {}));
              setNote(null);
              setManual(false);
            }}
          >
            Search by address instead
          </Button>
        </div>
      )}
    </div>
  );
}
