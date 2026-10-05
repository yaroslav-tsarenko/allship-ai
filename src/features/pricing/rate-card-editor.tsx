"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { addIcon, deleteIcon, warningIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { Switch } from "@/components/ui/switch";
import { TextField } from "@/components/ui/text-field";
import { US_STATES } from "@/features/loads/schema";
import { bedroomVolumes, packingLevels, priceMove, tierGaps, validateTiers, type PackingLevel, type RateTier } from "@/features/moving/pricing";
import { feeFor, formatUsd } from "@/lib/money";
import { saveRateCardAction } from "@/server/actions/matcher";
import type { RateCardInput } from "./schema";

type TierDraft = { key: number; from: string; to: string; rate: string };

const toDollars = (cents: number) => (cents ? (cents / 100).toFixed(2) : "");
const toCents = (v: string) => {
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && v.trim() !== "" ? Math.round(n * 100) : 0;
};
const toInt = (v: string) => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) ? n : NaN;
};

let nextKey = 1;

export function RateCardEditor({ initial, feePercent, listed }: { initial: RateCardInput; feePercent: number; listed: boolean }) {
  const [enabled, setEnabled] = useState(initial.instantQuotes);
  const [minMiles, setMinMiles] = useState(String(initial.minMiles));
  const [maxMiles, setMaxMiles] = useState(String(initial.maxMiles));
  const [states, setStates] = useState<string[]>(initial.serviceStates);
  const [tiers, setTiers] = useState<TierDraft[]>(() => initial.tiers.map((t) => ({ key: nextKey++, from: String(t.fromMiles), to: String(t.toMiles), rate: toDollars(t.ratePerCuFtCents) })));
  const [packing, setPacking] = useState(toDollars(initial.packingPerCuFtCents));
  const [unpacking, setUnpacking] = useState(toDollars(initial.unpackingPerCuFtCents));
  const [storage, setStorage] = useState(toDollars(initial.storagePerCuFtMonthCents));
  const [preview, setPreview] = useState({ bedrooms: "2", miles: "500", packing: "none" as PackingLevel });
  const save = useAction(saveRateCardAction);

  const parsed: RateTier[] = tiers.map((t) => ({ fromMiles: toInt(t.from), toMiles: toInt(t.to), ratePerCuFtCents: toCents(t.rate) }));
  const issues = validateTiers(parsed);
  const issueFor = (i: number) => issues.find((x) => x.index === i)?.message;
  const min = toInt(minMiles);
  const max = toInt(maxMiles);
  const rangeError = Number.isNaN(min) || Number.isNaN(max) ? "Enter whole miles" : max < min ? "The maximum must be at or above the minimum" : undefined;
  const gaps = issues.length || rangeError ? [] : tierGaps(parsed, min, max);
  const rates = { packingPerCuFtCents: toCents(packing), unpackingPerCuFtCents: toCents(unpacking), storagePerCuFtMonthCents: toCents(storage) };

  const sample = (() => {
    if (issues.length) return null;
    const miles = Number(preview.miles);
    const volume = bedroomVolumes[Number(preview.bedrooms) - 1] ?? 600;
    if (!Number.isFinite(miles) || miles < 0) return null;
    const q = priceMove(parsed, rates, { volumeCuFt: volume, miles, packing: preview.packing, unpacking: false, storageMonths: 0 });
    return { q, volume, miles, outside: !Number.isNaN(min) && !Number.isNaN(max) && (miles < min || miles > max) };
  })();

  const addTier = () => {
    const last = parsed.at(-1);
    const from = last && Number.isFinite(last.toMiles) ? last.toMiles + 1 : 0;
    setTiers((t) => [...t, { key: nextKey++, from: String(from), to: String(from + 499), rate: "" }]);
  };

  const submit = async () => {
    if (issues.length || rangeError) return void toast.error("Fix the highlighted rates first.");
    const res = await save.executeAsync({
      instantQuotes: enabled,
      minMiles: min,
      maxMiles: max,
      serviceStates: states,
      tiers: parsed,
      ...rates,
    });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.validationErrors) return void toast.error("Check the values and try again.");
    toast(enabled ? "Rates saved. Shippers can book you instantly." : "Rates saved. Instant quotes are off.");
  };

  const toggleState = (code: string) => setStates((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));

  return (
    <div className="flex flex-col gap-6">
      <Card as="section" aria-labelledby="iq-title" className="p-6">
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          label={<span id="iq-title" className="text-title-lg">Show my instant quotes on the moving page</span>}
          description="Shippers see your price next to other movers, sorted by total. Off means you only get loads through regular bidding."
        />
        {enabled && !listed && (
          <p className="mt-4 flex gap-2 rounded-sm bg-warning-container p-3 text-body-md text-on-warning-container">
            <Icon icon={warningIcon} size={20} className="mt-px shrink-0" />
            Your quotes appear once your USDOT and MC numbers are verified.
          </p>
        )}
      </Card>

      <Card as="section" aria-labelledby="tiers-title" className="p-6">
        <h2 id="tiers-title" className="text-title-lg">
          Rate per cubic foot by distance
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">Ranges are in whole road miles and can&rsquo;t overlap. A move whose distance falls outside every range gets no instant quote from you.</p>
        <div className="mt-5 flex flex-col gap-3">
          {tiers.length === 0 && <p className="rounded-sm bg-surface-container-low p-4 text-body-md text-on-surface-variant">No ranges yet. Add one to start quoting.</p>}
          {tiers.map((t, i) => {
            const err = issueFor(i);
            const set = (patch: Partial<TierDraft>) => setTiers((all) => all.map((x) => (x.key === t.key ? { ...x, ...patch } : x)));
            return (
              <fieldset key={t.key} className="grid grid-cols-2 items-start gap-3 medium:grid-cols-[1fr_1fr_1fr_auto]">
                <legend className="sr-only">Range {i + 1}</legend>
                <TextField label="From, mi" inputMode="numeric" value={t.from} onChange={(e) => set({ from: e.target.value })} error={err ? " " : undefined} />
                <TextField label="To, mi" inputMode="numeric" value={t.to} onChange={(e) => set({ to: e.target.value })} error={err ? " " : undefined} />
                <TextField label="Rate per ft³" inputMode="decimal" leading="$" value={t.rate} onChange={(e) => set({ rate: e.target.value })} error={err} className="col-span-2 medium:col-span-1" />
                <Button variant="text" onClick={() => setTiers((all) => all.filter((x) => x.key !== t.key))} aria-label={`Remove range ${i + 1}`} className="col-span-2 justify-self-start medium:col-span-1 medium:mt-2">
                  <Icon icon={deleteIcon} size={20} />
                  Remove
                </Button>
              </fieldset>
            );
          })}
        </div>
        <Button variant="tonal" onClick={addTier} className="mt-4" disabled={tiers.length >= 20}>
          <Icon icon={addIcon} size={20} />
          Add range
        </Button>

        <div className="mt-6 grid gap-3 border-t border-outline-variant pt-5 medium:grid-cols-2">
          <TextField label="Shortest move you quote, mi" inputMode="numeric" value={minMiles} onChange={(e) => setMinMiles(e.target.value)} error={rangeError} />
          <TextField label="Longest move you quote, mi" inputMode="numeric" value={maxMiles} onChange={(e) => setMaxMiles(e.target.value)} />
        </div>
        {gaps.length > 0 && (
          <p className="mt-4 text-body-md text-on-surface-variant">
            No rate for {gaps.map(([a, b]) => (a === b ? `${a} mi` : `${a}–${b} mi`)).join(", ")}. Moves of those distances won&rsquo;t show your price.
          </p>
        )}
      </Card>

      <Card as="section" aria-labelledby="services-title" className="p-6">
        <h2 id="services-title" className="text-title-lg">
          Services
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">Per cubic foot. Leave a rate empty if you don&rsquo;t offer the service: moves that ask for it won&rsquo;t get your instant quote. Packing is charged at the share the shipper picks (25%, 50% or 100%).</p>
        <div className="mt-5 grid gap-3 medium:grid-cols-3">
          <TextField label="Packing per ft³" inputMode="decimal" leading="$" value={packing} onChange={(e) => setPacking(e.target.value)} />
          <TextField label="Unpacking per ft³" inputMode="decimal" leading="$" value={unpacking} onChange={(e) => setUnpacking(e.target.value)} />
          <TextField label="Storage per ft³, month" inputMode="decimal" leading="$" value={storage} onChange={(e) => setStorage(e.target.value)} />
        </div>
      </Card>

      <Card as="section" aria-labelledby="states-title" className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="states-title" className="text-title-lg">
            Where you move
          </h2>
          <p className="text-body-md text-on-surface-variant">{states.length === 0 ? "All states" : `${states.length} selected`}</p>
        </div>
        <p className="mt-1 text-body-md text-on-surface-variant">A move qualifies when it starts or ends in one of these states. Select none to quote everywhere.</p>
        <div className="mt-4 grid grid-cols-4 gap-1 medium:grid-cols-9" role="group" aria-label="Service states">
          {US_STATES.map(([code, name]) => {
            const on = states.includes(code);
            return (
              <button
                key={code}
                type="button"
                aria-pressed={on}
                title={name}
                onClick={() => toggleState(code)}
                className={`state-layer h-9 cursor-pointer rounded-xs font-mono text-label-lg ${on ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant"}`}
              >
                {code}
              </button>
            );
          })}
        </div>
        {states.length > 0 && (
          <Button variant="text" onClick={() => setStates([])} className="mt-3">
            Clear, quote in all states
          </Button>
        )}
      </Card>

      <Card as="section" aria-labelledby="preview-title" variant="filled" className="bg-surface-container-low p-6">
        <h2 id="preview-title" className="text-title-lg">
          Preview
        </h2>
        <div className="mt-4 grid gap-3 medium:grid-cols-3">
          <SelectField label="Home size" value={preview.bedrooms} onChange={(e) => setPreview((p) => ({ ...p, bedrooms: e.target.value }))} options={bedroomVolumes.map((v, i) => ({ value: String(i + 1), label: `${i + 1} ${i ? "bedrooms" : "bedroom"} · ${v} ft³` }))} />
          <TextField label="Distance, mi" inputMode="numeric" value={preview.miles} onChange={(e) => setPreview((p) => ({ ...p, miles: e.target.value }))} />
          <SelectField label="Packing" value={preview.packing} onChange={(e) => setPreview((p) => ({ ...p, packing: e.target.value as PackingLevel }))} options={(Object.keys(packingLevels) as PackingLevel[]).map((k) => ({ value: k, label: packingLevels[k].label }))} />
        </div>
        <p aria-live="polite" className="mt-5 text-body-lg text-pretty text-on-surface">
          {!sample
            ? "Fix the ranges above to see a preview."
            : sample.outside
              ? `${sample.miles} miles is outside the distances you quote, so this move gets no instant quote from you.`
              : !sample.q
                ? `No instant quote: ${preview.packing !== "none" && !rates.packingPerCuFtCents ? "you have no packing rate" : "no range covers this distance"}.`
                : `A ${preview.bedrooms}-bedroom move (${sample.volume.toLocaleString("en-US")} ft³) of ${Number(preview.miles).toLocaleString("en-US")} miles would quote ${formatUsd(sample.q.carrierCents)}. You receive all of it; the shipper pays ${formatUsd(feeFor(sample.q.carrierCents, feePercent * 100).shipperTotalCents)} with the ${feePercent}% service fee.`}
        </p>
      </Card>

      <div className="sticky bottom-24 z-10 flex justify-end medium:bottom-4">
        <Button size="lg" onClick={submit} loading={save.isPending} className="shadow-elevation-2">
          Save rates
        </Button>
      </div>
    </div>
  );
}
