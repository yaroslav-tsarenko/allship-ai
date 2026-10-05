"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextField } from "@/components/ui/text-field";
import { estimateCarShipping, vehicleSizes, type Condition, type TrailerType, type VehicleSize } from "./car-shipping-math";
import { usd } from "./rate-curve";
import { CalculatorLayout, FieldGroup, parseNumber, ResultPanel, ResultRows, SelectField, Unit, useTrackOnce } from "./tool-ui";

const trailerOptions: Array<{ value: TrailerType; label: string }> = [
  { value: "open", label: "Open" },
  { value: "enclosed", label: "Enclosed" },
];
const conditionOptions: Array<{ value: Condition; label: string }> = [
  { value: "running", label: "Runs" },
  { value: "inoperable", label: "Doesn't run" },
];

const sizeHint: Record<VehicleSize, string> = {
  sedan: "compact, sedan or coupe",
  suv: "crossover, SUV or minivan",
  pickup: "half-ton or three-quarter-ton",
  oversized: "lifted, dually, long bed or full-size van",
};

const sizeOptions = vehicleSizes.map((v) => ({ value: v.value, label: `${v.label}: ${sizeHint[v.value]}` }));

const fmtRange = (low: number, high: number) => `${usd.format(low)} – ${usd.format(high)}`;

export function CarShippingCalculator() {
  const [miles, setMiles] = useState("1000");
  const [size, setSize] = useState<VehicleSize>("sedan");
  const [trailer, setTrailer] = useState<TrailerType>("open");
  const [condition, setCondition] = useState<Condition>("running");
  const markUsed = useTrackOnce("car-shipping-cost");

  const milesValue = parseNumber(miles);
  const ready = Number.isFinite(milesValue) && milesValue > 0;
  const estimate = useMemo(() => estimateCarShipping({ miles: ready ? milesValue : 0, size, trailer, condition }), [ready, milesValue, size, trailer, condition]);

  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    markUsed();
  };

  return (
    <CalculatorLayout
      label="Car shipping cost calculator"
      inputs={
        <>
          <FieldGroup legend="Distance">
            <TextField label="Driving distance" inputMode="decimal" value={miles} onChange={(e) => change(setMiles)(e.target.value)} trailing={<Unit>miles</Unit>} supportingText="Pickup to delivery by road." />
          </FieldGroup>
          <FieldGroup legend="Vehicle">
            <SelectField label="Vehicle size" value={size} onChange={(e) => change(setSize)(e.target.value as VehicleSize)} options={sizeOptions} />
          </FieldGroup>
          <FieldGroup legend="Trailer" hint={trailer === "open" ? "Most cars ship on open multi-car trailers." : "Covered trailer for classic, exotic or freshly restored cars."}>
            <SegmentedButton label="Trailer" value={trailer} onChange={change(setTrailer)} options={trailerOptions} />
          </FieldGroup>
          <FieldGroup legend="Condition" hint={condition === "inoperable" ? "The carrier needs a winch or forklift to load it." : "The car starts, steers and brakes on its own."}>
            <SegmentedButton label="Condition" value={condition} onChange={change(setCondition)} options={conditionOptions} />
          </FieldGroup>
        </>
      }
      result={
        <ResultPanel
          eyebrow="Estimated total"
          footer={
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/quote?category=car-or-light-truck&src=tool-car-shipping-cost">
                  Get bids from carriers
                  <Icon icon={arrowForwardIcon} size={20} />
                </Link>
              </Button>
              <p className="text-body-sm text-on-surface-variant">Payment is held in escrow until delivery.</p>
            </div>
          }
        >
          {ready ? (
            <>
              <p className="mt-2 font-mono text-headline-md tracking-tight text-on-surface tabular-nums medium:text-headline-lg">{fmtRange(estimate.total.low, estimate.total.high)}</p>
              <p className="mt-2 text-body-md text-on-surface-variant">Rough estimate — carriers set the real price in their bids.</p>
              <ResultRows
                rows={[
                  { label: "Carrier price", value: fmtRange(estimate.carrierTotal.low, estimate.carrierTotal.high), strong: true },
                  { label: "AllShip service fee, 10%", value: fmtRange(estimate.serviceFee.low, estimate.serviceFee.high) },
                  { label: "Carrier price per mile", value: estimate.perMile ? `$${estimate.perMile.low.toFixed(2)} – $${estimate.perMile.high.toFixed(2)}` : "—" },
                ]}
              />
            </>
          ) : (
            <p className="mt-2 text-body-lg text-on-surface-variant">Enter a distance to see a range.</p>
          )}
        </ResultPanel>
      }
    />
  );
}
