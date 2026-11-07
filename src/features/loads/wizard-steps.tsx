"use client";

import { useMemo, useState } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { closeIcon, editIcon, infoIcon, searchIcon, tripOriginIcon, locationOnIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { categories, categoryGroups, type CategoryGroup } from "@/content/categories";
import { cn } from "@/lib/cn";
import { StopLocationFields } from "@/features/location/location-field";
import { formatUsd } from "@/lib/money";
import type { LoadCategory } from "@/server/db/schema/enums";
import { categoryIcons, formatWindow } from "./presentation";
import { addDays, localToday, MAX_DAYS_AHEAD } from "./route-rules";
import { useLiveRevalidation } from "./live-validation";
import { MakeField, ModelField, VinField, YearField } from "@/features/vehicles/vehicle-fields";
import { describeDetail, detailHints, hasOther, loadSpecs, numberHelp, OTHER, otherKey, type FieldSpec } from "./spec";
import { biddingDayOptions, type WizardValues } from "./wizard-model";

const groupOrder: CategoryGroup[] = ["vehicles", "moving", "freight", "trucks"];

export function CategoryStep({ onPick }: { onPick: (category: LoadCategory) => void }) {
  const { control, formState } = useFormContext<WizardValues>();
  const selected = useWatch({ control, name: "category" });
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      groupOrder
        .map((g) => ({
          group: g,
          items: categories.filter((c) => c.group === g && (!q || `${c.name} ${c.shortName} ${c.summary}`.toLowerCase().includes(q))),
        }))
        .filter((g) => g.items.length > 0),
    [q],
  );
  const error = get(formState.errors, "category")?.message as string | undefined;

  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="Search categories"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-tour="wizard-category-search"
        leading={<Icon icon={searchIcon} />}
        trailing={
          query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="state-layer inline-flex size-10 cursor-pointer items-center justify-center rounded-full">
              <Icon icon={closeIcon} size={20} />
            </button>
          ) : undefined
        }
        className="max-w-[480px]"
      />
      {error && (
        <p role="alert" className="text-body-md text-error">
          {error}
        </p>
      )}
      {groups.length === 0 && <p className="py-8 text-center text-body-lg text-on-surface-variant">No categories match &ldquo;{query}&rdquo;. Try &ldquo;car&rdquo;, &ldquo;move&rdquo; or &ldquo;pallet&rdquo;.</p>}
      {groups.map(({ group, items }) => (
        <section key={group} data-tour="wizard-category-group" aria-labelledby={`cat-${group}`}>
          <h3 id={`cat-${group}`} className="mb-3 text-title-sm text-on-surface-variant">
            {categoryGroups[group].label}
          </h3>
          <ul className="grid grid-cols-1 gap-2 medium:grid-cols-2 expanded:grid-cols-3" role="list">
            {items.map((c) => {
              const active = selected === c.key;
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPick(c.key)}
                    className={cn(
                      "state-layer flex h-full w-full cursor-pointer items-start gap-3 rounded-md border p-3 text-left transition-colors duration-150 ease-standard",
                      active ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant bg-surface text-on-surface",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-sm",
                        active ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container",
                      )}
                    >
                      <Icon icon={categoryIcons[c.key]} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-title-sm">{c.name}</span>
                      <span className={cn("mt-0.5 line-clamp-2 block text-body-sm", active ? "text-on-primary-container/80" : "text-on-surface-variant")}>{c.summary}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

const RESERVE = "\u00a0";

function OtherText({ name }: { name: string }) {
  const { register, formState } = useFormContext<WizardValues>();
  const path = `details.${otherKey(name)}` as const;
  const error = get(formState.errors, path)?.message as string | undefined;
  return <TextField label="What is it?" required maxLength={80} supportingText="A few words carriers can price, like “pool table”." error={error} className="mt-3" {...register(path)} />;
}

function DetailField({ field }: { field: FieldSpec }) {
  const { register, control, formState } = useFormContext<WizardValues>();
  const name = `details.${field.name}` as const;
  const error = get(formState.errors, name)?.message as string | undefined;
  const label = field.label;
  const current = useWatch({ control, name });
  const showOther = hasOther(field) && (Array.isArray(current) ? current.includes(OTHER) : current === OTHER);

  switch (field.kind) {
    case "text":
      return <TextField label={label} required={field.required} maxLength={field.maxLength} supportingText={field.placeholder ? `For example, ${field.placeholder}` : (field.help ?? RESERVE)} error={error} {...register(name)} />;
    case "number":
      return (
        <TextField
          label={label}
          required={field.required}
          inputMode={field.integer ? "numeric" : "decimal"}
          type="number"
          min={field.min}
          max={field.max}
          step={field.integer ? 1 : "any"}
          supportingText={numberHelp(field)}
          trailing={field.unit ? <span className="pr-3 text-body-lg">{field.unit}</span> : undefined}
          error={error}
          {...register(name)}
        />
      );
    case "year":
      return <YearField prefix="details" name={field.name} label={label} required={field.required} min={field.min} />;
    case "make":
      return <MakeField prefix="details" name={field.name} label={label} required={field.required} catalog={field.catalog} />;
    case "model":
      return <ModelField prefix="details" name={field.name} label={label} required={field.required} catalog={field.catalog} />;
    case "vin":
      return <VinField prefix="details" name={field.name} label={label} help={field.help} fill={["year", "make", "model", "bodyType"]} />;
    case "select":
      return (
        <div>
          <SelectField label={label} required={field.required} options={field.options} supportingText={field.help ?? RESERVE} error={error} {...register(name)} />
          {showOther && <OtherText name={field.name} />}
        </div>
      );
    case "multiselect":
      return (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => {
            const value = Array.isArray(f.value) ? (f.value as string[]) : [];
            return (
              <fieldset className="flex flex-col gap-2 outline-none" aria-invalid={error ? true : undefined} tabIndex={-1}>
                <legend className="mb-2 text-body-md text-on-surface-variant">
                  {label}
                  {field.required && <span aria-hidden="true"> *</span>}
                </legend>
                <ChipSet>
                  {field.options.map((o) => (
                    <Chip
                      key={o}
                      variant="filter"
                      label={o}
                      selected={value.includes(o)}
                      onClick={() => f.onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}
                    />
                  ))}
                </ChipSet>
                {error && (
                  <p role="alert" className="text-body-sm text-error">
                    {error}
                  </p>
                )}
                {showOther && <OtherText name={field.name} />}
              </fieldset>
            );
          }}
        />
      );
    case "switch":
      return (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => <Switch label={label} description={field.help} checked={Boolean(f.value)} onCheckedChange={f.onChange} className="py-2" />}
        />
      );
  }
}

function DetailHints({ category }: { category: LoadCategory }) {
  const { control } = useFormContext<WizardValues>();
  const details = useWatch({ control, name: "details" }) as Record<string, unknown> | undefined;
  const hints = detailHints(category, details ?? {});
  if (!hints.length) return null;
  return (
    <div role="status" className="flex items-start gap-3 rounded-md bg-tertiary-container p-4 text-on-tertiary-container">
      <Icon icon={infoIcon} size={20} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-1 text-body-md">
        {hints.map((h) => (
          <p key={h}>{h}</p>
        ))}
      </div>
    </div>
  );
}

const wide = (f: FieldSpec) => f.kind === "multiselect" || f.kind === "switch" || f.kind === "vin" || (f.kind === "text" && (f.maxLength ?? 0) > 80) || f.label.length > 34;

export function DetailsStep({ category }: { category: LoadCategory }) {
  const sections = loadSpecs[category];
  useLiveRevalidation("details");
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section key={section.title} aria-labelledby={`sec-${section.title}`}>
          <h3 id={`sec-${section.title}`} className="text-title-md text-on-surface">
            {section.title}
          </h3>
          {section.description && <p className="mt-0.5 text-body-md text-on-surface-variant">{section.description}</p>}
          <div className="mt-4 grid gap-x-4 gap-y-5 medium:grid-cols-2">
            {section.fields.map((f) => (
              <div key={f.name} className={cn(wide(f) && "medium:col-span-2")}>
                <DetailField field={f} />
              </div>
            ))}
          </div>
        </section>
      ))}
      <DetailHints category={category} />
    </div>
  );
}

function StopFields({ prefix, title, icon, minDate, maxDate }: { prefix: "pickup" | "dropoff"; title: string; icon: typeof tripOriginIcon; minDate: string; maxDate: string }) {
  const { register, formState } = useFormContext<WizardValues>();
  const err = (k: string) => get(formState.errors, `${prefix}.${k}`)?.message as string | undefined;
  const pickup = prefix === "pickup";
  return (
    <fieldset className="flex min-w-0 flex-col gap-5">
      <legend className="mb-4 flex items-center gap-2 text-title-md text-on-surface">
        <Icon icon={icon} size={20} className={pickup ? "text-primary" : "text-tertiary"} filled />
        {title}
      </legend>
      <StopLocationFields prefix={prefix} label={pickup ? "Pickup address" : "Delivery address"} addressRequired addressHelp="Only the carrier you book sees it. Bidders see the city and ZIP." />
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
        <TextField label={pickup ? "Earliest pickup" : "Earliest delivery"} type="date" required min={minDate} max={maxDate} supportingText={pickup ? "First day the load is ready" : "First day someone can receive it"} error={err("windowStart")} {...register(`${prefix}.windowStart`)} />
        <TextField label={pickup ? "Latest pickup" : "Latest delivery"} type="date" min={minDate} max={maxDate} supportingText="Optional. A wider window gets more bids." error={err("windowEnd")} {...register(`${prefix}.windowEnd`)} />
      </div>
      <TextArea
        label={pickup ? "Pickup notes" : "Delivery notes"}
        rows={2}
        maxLength={500}
        showCount
        supportingText={pickup ? "Gate codes, parking, loading dock hours. No phone numbers, they're shared after booking." : "Access limits, receiving hours. No phone numbers, they're shared after booking."}
        error={err("notes")}
        {...register(`${prefix}.notes`)}
      />
    </fieldset>
  );
}

export function RouteStep() {
  const today = localToday();
  const maxDate = addDays(today, MAX_DAYS_AHEAD);
  const { control } = useFormContext<WizardValues>();
  const pickupStart = useWatch({ control, name: "pickup.windowStart" });
  useLiveRevalidation("pickup", "dropoff");
  return (
    <div className="flex flex-col gap-10">
      <StopFields prefix="pickup" title="Pickup" icon={tripOriginIcon} minDate={today} maxDate={maxDate} />
      <div className="border-t border-outline-variant" />
      <StopFields prefix="dropoff" title="Delivery" icon={locationOnIcon} minDate={pickupStart && pickupStart >= today ? pickupStart : today} maxDate={addDays(maxDate, 60)} />
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-surface-container-low p-4 medium:p-5" aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-title-sm text-on-surface-variant">{title}</h3>
        <button type="button" onClick={onEdit} className="state-layer inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-label-lg font-medium text-primary">
          <Icon icon={editIcon} size={18} />
          Edit
          <span className="sr-only">{title.toLowerCase()}</span>
        </button>
      </div>
      {children}
    </section>
  );
}

export function ReviewStep({ onEdit, suggestion, onUseSuggestion }: { onEdit: (step: number) => void; suggestion: string; onUseSuggestion: () => void }) {
  const { register, control, formState } = useFormContext<WizardValues>();
  const values = useWatch({ control }) as WizardValues;
  const category = values.category as LoadCategory;
  const cat = categories.find((c) => c.key === category);
  const err = (k: string) => get(formState.errors, k)?.message as string | undefined;
  const rows = (loadSpecs[category] ?? []).flatMap((s) => s.fields).map((f) => ({ label: f.label, value: describeDetail(f, values.details?.[f.name], values.details) })).filter((r) => r.value);
  const price = values.targetPrice?.replace(/,/g, "");
  const showSuggestion = suggestion && suggestion !== values.title?.trim();

  return (
    <div className="grid gap-8 expanded:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <TextField label="Title" required maxLength={100} supportingText="Carriers see this first. Say what it is and where it's going." error={err("title")} {...register("title")} />
          {showSuggestion && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-body-sm text-on-surface-variant">Suggested</span>
              <Chip variant="suggestion" label={suggestion} onClick={onUseSuggestion} className="max-w-full [&>span]:truncate" />
            </div>
          )}
        </div>
        <TextArea label="Notes for carriers" rows={4} maxLength={2000} showCount supportingText="Anything that affects the price: tight access, special handling, flexible dates. Contact details are shared after booking." error={err("notes")} {...register("notes")} />
        <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
          <TextField
            label="Target price"
            inputMode="decimal"
            leading={<span className="text-body-lg">$</span>}
            supportingText="Optional. Carriers see it as a guide, not a limit."
            error={err("targetPrice")}
            {...register("targetPrice")}
          />
          <SelectField label="Accept bids for" options={biddingDayOptions} required error={err("biddingDays")} supportingText="You can accept a bid any time before then." {...register("biddingDays")} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <ReviewBlock title="Load" onEdit={() => onEdit(0)}>
          <p className="flex items-center gap-2 text-title-md text-on-surface">
            {category && <Icon icon={categoryIcons[category]} size={20} className="text-on-surface-variant" />}
            {cat?.name}
          </p>
          {price && Number(price) > 0 && <p className="mt-1 text-body-md text-on-surface-variant">Target {formatUsd(Math.round(Number(price) * 100), true)}</p>}
        </ReviewBlock>
        <ReviewBlock title="Details" onEdit={() => onEdit(1)}>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-body-md">
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-on-surface-variant">{r.label}</dt>
                <dd className="text-on-surface">{r.value}</dd>
              </div>
            ))}
          </dl>
        </ReviewBlock>
        <ReviewBlock title="Route" onEdit={() => onEdit(2)}>
          <div className="flex flex-col gap-2 text-body-md">
            <p className="flex items-start gap-2">
              <Icon icon={tripOriginIcon} size={18} filled className="mt-0.5 shrink-0 text-primary" />
              <span>
                <span className="block text-on-surface">
                  {values.pickup?.city}, {values.pickup?.state} {values.pickup?.postalCode}
                </span>
                <span className="block text-on-surface-variant">{formatWindow(values.pickup)}</span>
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Icon icon={locationOnIcon} size={18} filled className="mt-0.5 shrink-0 text-tertiary" />
              <span>
                <span className="block text-on-surface">
                  {values.dropoff?.city}, {values.dropoff?.state} {values.dropoff?.postalCode}
                </span>
                <span className="block text-on-surface-variant">{formatWindow(values.dropoff)}</span>
              </span>
            </p>
          </div>
        </ReviewBlock>
      </div>
    </div>
  );
}
