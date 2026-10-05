"use client";

import { useMemo, useState } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { closeIcon, editIcon, searchIcon, tripOriginIcon, locationOnIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { categories, categoryGroups, type CategoryGroup } from "@/content/categories";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import type { LoadCategory } from "@/server/db/schema/enums";
import { categoryIcons, formatWindow } from "./presentation";
import { US_STATES } from "./schema";
import { describeDetail, loadSpecs, type FieldSpec } from "./spec";
import { biddingDayOptions, type WizardValues } from "./wizard-model";

const groupOrder: CategoryGroup[] = ["vehicles", "moving", "freight", "trucks"];
const stateOptions = US_STATES.map(([value, name]) => ({ value, label: `${name} (${value})` }));

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

function DetailField({ field }: { field: FieldSpec }) {
  const { register, control, formState } = useFormContext<WizardValues>();
  const name = `details.${field.name}` as const;
  const error = get(formState.errors, name)?.message as string | undefined;
  const label = field.label;

  switch (field.kind) {
    case "text":
      return <TextField label={label} required={field.required} maxLength={field.maxLength} supportingText={field.placeholder ? `For example, ${field.placeholder}` : field.help} error={error} {...register(name)} />;
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
          supportingText={field.help}
          trailing={field.unit ? <span className="pr-3 text-body-lg">{field.unit}</span> : undefined}
          error={error}
          {...register(name)}
        />
      );
    case "year":
      return <TextField label={label} required={field.required} inputMode="numeric" type="number" min={1900} max={new Date().getFullYear() + 1} error={error} {...register(name)} />;
    case "select":
      return <SelectField label={label} required={field.required} options={field.options} supportingText={field.help} error={error} {...register(name)} />;
    case "multiselect":
      return (
        <Controller
          control={control}
          name={name}
          render={({ field: f }) => {
            const value = Array.isArray(f.value) ? (f.value as string[]) : [];
            return (
              <fieldset className="flex flex-col gap-2" aria-invalid={error ? true : undefined}>
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

const wide = (f: FieldSpec) => f.kind === "multiselect" || f.kind === "switch" || (f.kind === "text" && (f.maxLength ?? 0) > 80) || f.label.length > 34;

export function DetailsStep({ category }: { category: LoadCategory }) {
  const sections = loadSpecs[category];
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
    </div>
  );
}

function StopFields({ prefix, title, icon, minDate }: { prefix: "pickup" | "dropoff"; title: string; icon: typeof tripOriginIcon; minDate: string }) {
  const { register, formState } = useFormContext<WizardValues>();
  const err = (k: string) => get(formState.errors, `${prefix}.${k}`)?.message as string | undefined;
  const pickup = prefix === "pickup";
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-4 flex items-center gap-2 text-title-md text-on-surface">
        <Icon icon={icon} size={20} className={pickup ? "text-primary" : "text-tertiary"} filled />
        {title}
      </legend>
      <TextField label="Street address" required autoComplete={`section-${prefix} street-address`} error={err("address")} {...register(`${prefix}.address`)} />
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
        <TextField label="City" required autoComplete={`section-${prefix} address-level2`} error={err("city")} {...register(`${prefix}.city`)} />
        <SelectField label="State" required options={stateOptions} placeholder="Choose a state" error={err("state")} {...register(`${prefix}.state`)} />
        <TextField label="ZIP code" required inputMode="numeric" autoComplete={`section-${prefix} postal-code`} maxLength={10} error={err("postalCode")} {...register(`${prefix}.postalCode`)} />
      </div>
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
        <TextField label={pickup ? "Earliest pickup" : "Earliest delivery"} type="date" required min={minDate} error={err("windowStart")} {...register(`${prefix}.windowStart`)} />
        <TextField label={pickup ? "Latest pickup" : "Latest delivery"} type="date" min={minDate} supportingText="Optional. A wider window gets more bids." error={err("windowEnd")} {...register(`${prefix}.windowEnd`)} />
      </div>
      <TextArea
        label={pickup ? "Pickup notes" : "Delivery notes"}
        rows={2}
        maxLength={500}
        showCount
        supportingText={pickup ? "Gate codes, parking, loading dock hours" : "Who receives it, access limits, call-ahead"}
        error={err("notes")}
        {...register(`${prefix}.notes`)}
      />
    </fieldset>
  );
}

export function RouteStep() {
  const today = new Date().toISOString().slice(0, 10);
  const { control } = useFormContext<WizardValues>();
  const pickupStart = useWatch({ control, name: "pickup.windowStart" });
  return (
    <div className="flex flex-col gap-10">
      <StopFields prefix="pickup" title="Pickup" icon={tripOriginIcon} minDate={today} />
      <div className="border-t border-outline-variant" />
      <StopFields prefix="dropoff" title="Delivery" icon={locationOnIcon} minDate={pickupStart || today} />
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
  const rows = (loadSpecs[category] ?? []).flatMap((s) => s.fields).map((f) => ({ label: f.label, value: describeDetail(f, values.details?.[f.name]) })).filter((r) => r.value);
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
        <TextArea label="Notes for carriers" rows={4} maxLength={2000} showCount supportingText="Anything that affects the price: tight access, special handling, flexible dates." error={err("notes")} {...register("notes")} />
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
