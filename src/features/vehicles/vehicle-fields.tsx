"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { isVpicCatalog, modelYears, popularMakes, VPIC_FIRST_YEAR, type MakeCatalog } from "./catalog";
import { decodeVehicle, fetchMakes, fetchModels } from "./client";
import { normalizeVin, vinIssue } from "./vin";

type Option = { value: string; custom?: boolean };

function rank(list: readonly string[], query: string, limit = 60): Option[] {
  const q = query.trim().toLowerCase();
  if (!q) return list.slice(0, limit).map((value) => ({ value }));
  const starts: string[] = [];
  const contains: string[] = [];
  for (const item of list) {
    const l = item.toLowerCase();
    if (l.startsWith(q)) starts.push(item);
    else if (l.includes(q) || l.replace(/[^a-z0-9]/g, "").includes(q.replace(/[^a-z0-9]/g, ""))) contains.push(item);
  }
  const out: Option[] = [...starts, ...contains].slice(0, limit).map((value) => ({ value }));
  if (!list.some((i) => i.toLowerCase() === q)) out.push({ value: query.trim(), custom: true });
  return out;
}

function SearchableText({ name, label, required, options, loading, help, onPicked }: { name: string; label: string; required?: boolean; options: readonly string[]; loading?: boolean; help: string; onPicked?: (value: string) => void }) {
  const { control, formState } = useFormContext();
  const error = get(formState.errors, name)?.message as string | undefined;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = typeof field.value === "string" ? field.value : field.value == null ? "" : String(field.value);
        return (
          <Combobox<Option>
            label={label}
            required={required}
            name={field.name}
            ref={field.ref}
            value={value}
            onInputChange={field.onChange}
            onBlur={field.onBlur}
            items={rank(options, value)}
            loading={loading}
            minChars={0}
            openOnFocus
            maxLength={60}
            itemKey={(o) => `${o.custom ? "custom:" : ""}${o.value}`}
            renderItem={(o) => (o.custom ? <span className="text-on-surface-variant">Other: use &ldquo;{o.value}&rdquo;</span> : o.value)}
            onSelectItem={(o) => {
              field.onChange(o.value);
              onPicked?.(o.value);
            }}
            listLabel={`${label} options`}
            supportingText={help}
            error={error}
          />
        );
      }}
    />
  );
}

export function MakeField({ prefix, name, label, required, catalog }: { prefix: string; name: string; label: string; required?: boolean; catalog: MakeCatalog }) {
  const { setValue } = useFormContext();
  const [remote, setRemote] = useState<{ items: string[]; loading: boolean; available: boolean }>({ items: [], loading: false, available: true });
  const asked = useRef(false);
  const vpic = isVpicCatalog(catalog);
  const popular = popularMakes[catalog];

  const load = () => {
    if (!vpic || asked.current) return;
    asked.current = true;
    setRemote((r) => ({ ...r, loading: true }));
    fetchMakes(catalog).then((res) => setRemote({ items: res.items, loading: false, available: res.available }));
  };

  const options = useMemo(() => {
    if (!remote.items.length) return popular;
    const set = new Set(popular.map((p) => p.toLowerCase()));
    return [...popular, ...remote.items.filter((m) => !set.has(m.toLowerCase()))];
  }, [popular, remote.items]);

  return (
    <div onFocusCapture={load}>
      <SearchableText
        name={`${prefix}.${name}`}
        label={label}
        required={required}
        options={options}
        loading={remote.loading}
        help={vpic && !remote.available ? "Type the make. The list is offline right now." : "Pick from the list or type it."}
        onPicked={() => setValue(`${prefix}.model`, "", { shouldDirty: true })}
      />
    </div>
  );
}

export function ModelField({ prefix, name, label, required, catalog }: { prefix: string; name: string; label: string; required?: boolean; catalog: MakeCatalog }) {
  const { control } = useFormContext();
  const make = useWatch({ control, name: `${prefix}.make` }) as string | undefined;
  const year = Number(useWatch({ control, name: `${prefix}.year` }));
  const [state, setState] = useState<{ key: string; items: string[]; loading: boolean }>({ key: "", items: [], loading: false });
  const vpic = isVpicCatalog(catalog);
  const key = vpic && make?.trim() && year >= VPIC_FIRST_YEAR ? `${make.trim().toLowerCase()}|${year}` : "";

  useEffect(() => {
    if (!key || !isVpicCatalog(catalog)) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      setState({ key, items: [], loading: true });
      fetchModels(catalog, make!.trim(), year).then((res) => {
        if (!cancelled) setState({ key, items: res.items, loading: false });
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [key, catalog, make, year]);

  const items = state.key === key ? state.items : [];
  const help = !vpic ? "Optional details like trim or length help carriers." : !make ? "Choose the make first, or type the model." : items.length ? "Pick from the list or type it." : "Type the model.";

  return <SearchableText name={`${prefix}.${name}`} label={label} required={required} options={items} loading={state.key === key && state.loading} help={help} />;
}

export function YearField({ prefix, name, label, required, min = 1900 }: { prefix: string; name: string; label: string; required?: boolean; min?: number }) {
  const { register, formState } = useFormContext();
  const error = get(formState.errors, `${prefix}.${name}`)?.message as string | undefined;
  const years = useMemo(() => modelYears(new Date(), min).map(String), [min]);
  return <SelectField label={label} required={required} options={years} placeholder="Choose a year" error={error} supportingText={" "} {...register(`${prefix}.${name}`)} />;
}

export function VinField({ prefix, name, label, help, fill }: { prefix: string; name: string; label: string; help?: string; fill: string[] }) {
  const { control, setValue, formState, getValues } = useFormContext();
  const error = get(formState.errors, `${prefix}.${name}`)?.message as string | undefined;
  const [status, setStatus] = useState<string | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const decoded = useRef("");

  const decode = async (vin: string) => {
    if (decoded.current === vin) return;
    decoded.current = vin;
    setStatus("Looking up this VIN");
    const res = await decodeVehicle(vin);
    if (!res.ok) return setStatus(res.message);
    const v = res.vehicle;
    const opts = { shouldDirty: true, shouldValidate: formState.isSubmitted };
    const set = (field: string, value: string | number | null) => {
      if (value === null || value === "" || !fill.includes(field)) return;
      setValue(`${prefix}.${field}`, String(value), opts);
    };
    set("year", v.year);
    set("make", v.make);
    set("model", v.model);
    set("bodyType", v.bodyType);
    const found = [v.year, v.make, v.model].filter(Boolean).join(" ");
    setStatus(found ? `Found ${found}${v.body ? `, ${v.body.toLowerCase()}` : ""}. Check the details below.` : "We couldn't decode this VIN. Fill in the details below.");
  };

  return (
    <Controller
      control={control}
      name={`${prefix}.${name}`}
      render={({ field }) => (
        <TextField
          label={label}
          name={field.name}
          ref={field.ref}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={(e) => {
            const vin = normalizeVin(e.target.value).slice(0, 17);
            field.onChange(vin);
            setLocal(null);
            if (vin.length === 17) {
              const issue = vinIssue(vin);
              if (issue) {
                setLocal(issue);
                setStatus(null);
              } else void decode(vin);
            } else setStatus(null);
          }}
          onBlur={() => {
            field.onBlur();
            const vin = normalizeVin(String(getValues(`${prefix}.${name}`) ?? ""));
            if (vin && vin.length !== 17) setLocal(vinIssue(vin));
          }}
          maxLength={21}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          className="[&_input]:font-mono [&_input]:tracking-wide [&_input]:uppercase"
          error={error ?? local ?? undefined}
          supportingText={<span aria-live="polite">{status ?? help}</span>}
        />
      )}
    />
  );
}
