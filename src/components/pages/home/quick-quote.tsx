"use client";

import { useState } from "react";
import type { ComboboxInputProps } from "@/components/ui/combobox";
import { AreaField } from "@/features/location/area-field";

const modes = [
  { value: "moving", label: "Moving", path: "/moving", hint: "Instant prices from movers’ published rates. No sign-up to see them." },
  { value: "vehicle", label: "Vehicle", path: "/vehicle-load", hint: "Post free. FMCSA-verified carriers send bids, you pick one." },
  { value: "freight", label: "Freight", path: "/freight-load", hint: "Pallets, LTL or full truckload. Post free and compare bids." },
  { value: "heavy", label: "Heavy", path: "/heavy-load", hint: "Construction and farm equipment. Post free and compare bids." },
] as const;

type Mode = (typeof modes)[number]["value"];

const field =
  "peer h-14 w-full min-w-0 bg-transparent px-5 pt-5 pb-1.5 text-body-lg text-on-surface outline-none placeholder:text-transparent focus:placeholder:text-on-surface-variant/70";
const floating =
  "pointer-events-none absolute top-4 left-5 origin-left text-body-lg text-on-surface-variant transition-transform duration-(--duration-short4) ease-standard peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-primary peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-75";

function QuickInput({ label, invalid, ...props }: ComboboxInputProps) {
  return (
    <>
      <input {...props} aria-invalid={invalid || undefined} className={field} />
      <label htmlFor={props.id} className={floating}>
        {label}
      </label>
    </>
  );
}

export function QuickQuote({ arrowIcon, swapIcon, id = "qq", track = "hero_quick_quote", label = "Quick quote" }: { arrowIcon: React.ReactNode; swapIcon: React.ReactNode; id?: string; track?: string; label?: string }) {
  const [mode, setMode] = useState<Mode>("moving");
  const current = modes.find((m) => m.value === mode) ?? modes[0];
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <form id={id} action={current.path} method="get" aria-label={label} data-track={track} className="mx-auto w-full max-w-[760px] text-left">
      <fieldset className="flex flex-wrap justify-center gap-2">
        <legend className="sr-only">What are you shipping?</legend>
        {modes.map((m) => (
          <label
            key={m.value}
            className="state-layer relative inline-flex h-9 cursor-pointer items-center rounded-sm border border-outline-variant bg-surface px-4 text-label-lg font-medium text-on-surface-variant transition-colors duration-(--duration-short4) ease-standard has-[:checked]:border-transparent has-[:checked]:bg-secondary-container has-[:checked]:text-on-secondary-container has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
          >
            <input type="radio" name="kind" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
            {m.label}
          </label>
        ))}
      </fieldset>
      <div className="mt-4 grid rounded-lg border border-outline-variant bg-surface-container-lowest shadow-elevation-1 medium:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] medium:items-center medium:rounded-[28px]">
        <div className="relative">
          <AreaField id={`${id}-from`} name="from" label="From" maxLength={120} placeholder="ZIP or city, state" value={from} onValueChange={setFrom} inputComponent={QuickInput} />
        </div>
        <button
          type="button"
          onClick={swap}
          aria-label="Swap from and to"
          title="Swap from and to"
          className="state-layer hidden size-10 cursor-pointer items-center justify-center rounded-full text-on-surface-variant medium:inline-flex"
        >
          {swapIcon}
        </button>
        <div className="relative border-t border-outline-variant medium:border-t-0 medium:border-l">
          <AreaField id={`${id}-to`} name="to" label="To" maxLength={120} placeholder="ZIP or city, state" value={to} onValueChange={setTo} inputComponent={QuickInput} />
        </div>
        <div className="p-2 medium:pl-0">
          <button
            type="submit"
            className="state-layer inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[24px] bg-primary px-6 text-label-lg font-medium text-on-primary transition-[border-radius,box-shadow] duration-(--duration-short4) ease-standard hover:shadow-elevation-1 active:rounded-[12px] medium:w-auto"
          >
            Get prices
            {arrowIcon}
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-body-md text-on-surface-variant" aria-live="polite">
        {current.hint}
      </p>
    </form>
  );
}
