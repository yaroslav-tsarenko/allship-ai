"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { Turnstile } from "@/features/auth/turnstile";
import { AreaField } from "@/features/location/area-field";
import { findMatchesAction } from "@/server/actions/matcher";
import type { Match, MatchRoute } from "@/server/matcher/service";
import { BookDialog } from "./book-dialog";
import { MatchList } from "./match-list";
import { bedroomVolumes } from "./pricing";
import { moveRequestSchema, moveTypes, type MoveRequestData, type MoveRequestInput } from "./schema";

export type BookingIcons = {
  search: ReactNode;
  from: ReactNode;
  to: ReactNode;
  swap: ReactNode;
  star: ReactNode;
  verified: ReactNode;
  check: ReactNode;
  info: ReactNode;
  mail: ReactNode;
};

type Results = { route: MatchRoute; volumeCuFt: number; matches: Match[]; requirements: string[]; request: MoveRequestData };

const STORAGE_KEY = "allship:moving-search";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const defaults: MoveRequestInput = {
  moveType: "house",
  from: "",
  to: "",
  bedrooms: 2,
  pickupDate: "",
  deliveryDate: "",
  packing: "none",
  unpacking: false,
  storage: false,
  storageMonths: 0,
  climateControlled: false,
  insurance: false,
  longTerm: false,
};

const packingOptions = [
  { value: "none" as const, label: "None" },
  { value: "quarter" as const, label: "25%" },
  { value: "half" as const, label: "50%" },
  { value: "full" as const, label: "100%" },
];

function readSaved(): MoveRequestInput | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MoveRequestInput>;
    return { ...defaults, ...parsed, turnstileToken: undefined };
  } catch {
    return null;
  }
}

export function MovingBooking({ icons, feePercent }: { icons: BookingIcons; feePercent: number }) {
  const form = useForm<MoveRequestInput, unknown, MoveRequestData>({ resolver: zodResolver(moveRequestSchema), defaultValues: defaults, mode: "onTouched" });
  const { register, control, handleSubmit, setValue, setError, getValues, formState, reset } = form;
  const errors = formState.errors;
  const search = useAction(findMatchesAction);
  const [results, setResults] = useState<Results | null>(null);
  const [chosen, setChosen] = useState<Match | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const storage = useWatch({ control, name: "storage" });
  const pickupDate = useWatch({ control, name: "pickupDate" });

  useEffect(() => {
    const saved = readSaved();
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from")?.trim().slice(0, 120);
    const to = params.get("to")?.trim().slice(0, 120);
    const id = window.setTimeout(() => {
      setMinDate(today());
      if (saved) reset(saved);
      if (from) setValue("from", from, { shouldDirty: true });
      if (to) setValue("to", to, { shouldDirty: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [reset, setValue]);

  const all = useWatch({ control });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, turnstileToken: undefined }));
    } catch {}
  }, [all]);

  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const onSubmit = handleSubmit(async (values) => {
    const res = await search.executeAsync({ ...values, turnstileToken: captcha ?? undefined });
    setCaptchaReset((n) => n + 1);
    const data = res?.data;
    if (!data) return;
    if (!data.ok) {
      setError(data.field, { message: data.message }, { shouldFocus: true });
      return;
    }
    setResults({ route: data.route, volumeCuFt: data.volumeCuFt, matches: data.matches, requirements: data.requirements, request: values });
    window.setTimeout(() => document.getElementById("moving-results")?.focus(), 50);
  });

  const swap = () => {
    const { from, to } = getValues();
    setValue("from", to, { shouldDirty: true });
    setValue("to", from, { shouldDirty: true });
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate aria-label="Moving quote search" className="flex flex-col gap-6 rounded-xl bg-surface-container-lowest [--field-bg:var(--md-surface-container-lowest)] p-5 text-on-surface shadow-elevation-2 medium:p-8">
        <div className="grid gap-4 medium:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] medium:items-start">
          <Controller
            control={control}
            name="from"
            render={({ field }) => (
              <AreaField label="Moving from" placeholder="ZIP or city, state" leading={icons.from} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref} name={field.name} error={errors.from?.message} required supportingText="ZIP code or city, state" />
            )}
          />
          <button type="button" onClick={swap} aria-label="Swap from and to" className="state-layer hidden size-14 cursor-pointer items-center justify-center rounded-full text-on-surface-variant medium:inline-flex">
            {icons.swap}
          </button>
          <Controller
            control={control}
            name="to"
            render={({ field }) => (
              <AreaField label="Moving to" placeholder="ZIP or city, state" leading={icons.to} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref} name={field.name} error={errors.to?.message} required supportingText="ZIP code or city, state" />
            )}
          />
        </div>

        <div className="grid gap-4 medium:grid-cols-2 large:grid-cols-4">
          <SelectField label="Type of home" options={moveTypes.map((m) => ({ value: m.value, label: m.label }))} error={errors.moveType?.message} {...register("moveType")} />
          <SelectField
            label="Bedrooms"
            options={bedroomVolumes.map((v, i) => ({ value: String(i + 1), label: `${i + 1} ${i === 0 ? "bedroom" : "bedrooms"} · ${v.toLocaleString("en-US")} ft³` }))}
            error={errors.bedrooms?.message}
            {...register("bedrooms")}
          />
          <TextField label="Pickup date" type="date" min={minDate} error={errors.pickupDate?.message} required {...register("pickupDate")} />
          <TextField label="Delivery date" type="date" min={pickupDate || minDate} error={errors.deliveryDate?.message} supportingText="Optional" {...register("deliveryDate")} />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-title-sm text-on-surface">How much should the crew pack?</legend>
          <Controller control={control} name="packing" render={({ field }) => <SegmentedButton label="Packing" value={field.value ?? "none"} onChange={field.onChange} options={packingOptions} />} />
        </fieldset>

        <fieldset className="grid gap-x-6 gap-y-3 medium:grid-cols-2 large:grid-cols-3">
          <legend className="mb-3 text-title-sm text-on-surface">Extra services</legend>
          <Controller control={control} name="unpacking" render={({ field }) => <Checkbox label="Unpacking at the new home" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
          <Controller control={control} name="storage" render={({ field }) => <Checkbox label="Storage, priced by the month" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
          <Controller control={control} name="insurance" render={({ field }) => <Checkbox label="Full value protection (insurance)" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
          <Controller control={control} name="climateControlled" render={({ field }) => <Checkbox label="Climate-controlled" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
          <Controller control={control} name="longTerm" render={({ field }) => <Checkbox label="Long-term storage" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
        </fieldset>

        {storage && (
          <TextField
            label="Storage, months"
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            className="medium:max-w-[240px]"
            supportingText="How many months do you need storage for?"
            error={errors.storageMonths?.message}
            {...register("storageMonths")}
          />
        )}

        <Turnstile onToken={onToken} resetKey={captchaReset} />

        <div className="flex flex-col-reverse gap-4 border-t border-outline-variant pt-5 medium:flex-row medium:items-center medium:justify-between">
          <p className="text-body-md text-pretty text-on-surface-variant">Prices come from each mover&rsquo;s published rates. No sign-up to see them.</p>
          <Button type="submit" size="lg" loading={search.isPending} leading={icons.search} className="medium:min-w-[220px]">
            Search movers
          </Button>
        </div>
        <p aria-live="polite" className="text-body-md text-error empty:hidden">
          {search.result.serverError ?? ""}
        </p>
      </form>

      <div tabIndex={-1} id="moving-results" className="scroll-mt-24 outline-none" aria-live="polite">
        {results && <MatchList results={results} icons={icons} feePercent={feePercent} onChoose={setChosen} onEdit={() => document.getElementById("moving-quote")?.scrollIntoView({ behavior: "smooth", block: "start" })} />}
      </div>

      {results && chosen && <BookDialog match={chosen} results={results} icons={icons} feePercent={feePercent} onClose={() => setChosen(null)} onPriceChange={(updated) => setResults((r) => (r ? { ...r, matches: r.matches.map((m) => (m.carrierOrgId === updated.carrierOrgId ? updated : m)) } : r))} />}
    </>
  );
}
