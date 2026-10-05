"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextField } from "@/components/ui/text-field";
import { cubicFeetForHome, estimateMove, homeSizes, packingLevels, type HomeSize, type PackingLevel } from "./moving-cost-math";
import { num, usd } from "./rate-curve";
import { CalculatorLayout, FieldGroup, parseNumber, ResultPanel, ResultRows, SelectField, Unit, useTrackOnce } from "./tool-ui";

type SizeChoice = HomeSize | "custom";

const sizeOptions = [...homeSizes.map((h) => ({ value: h.value, label: `${h.label} · ${num.format(h.cubicFeet)} ft³` })), { value: "custom", label: "I know my cubic feet" }];
const packingOptions = packingLevels.map((p) => ({ value: p.value, label: p.share === 0 ? "None" : `${p.share * 100}%` }));

const fmtRange = (low: number, high: number) => (high <= 0 ? "$0" : `${usd.format(low)} – ${usd.format(high)}`);

export function MovingCostCalculator() {
  const [size, setSize] = useState<SizeChoice>("2");
  const [customFeet, setCustomFeet] = useState("");
  const [miles, setMiles] = useState("250");
  const [packing, setPacking] = useState<PackingLevel>("none");
  const [storage, setStorage] = useState("0");
  const [unpacking, setUnpacking] = useState(false);
  const markUsed = useTrackOnce("moving-cost");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("ft3");
    const value = raw ? Math.round(Number(raw)) : Number.NaN;
    if (Number.isFinite(value) && value > 0 && value < 100000) {
      const t = window.setTimeout(() => {
        setSize("custom");
        setCustomFeet(String(value));
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, []);

  const cubicFeet = size === "custom" ? parseNumber(customFeet) : cubicFeetForHome(size);
  const milesValue = parseNumber(miles);
  const ready = Number.isFinite(cubicFeet) && cubicFeet > 0 && Number.isFinite(milesValue) && milesValue >= 0;

  const estimate = useMemo(
    () => estimateMove({ cubicFeet: ready ? cubicFeet : 0, miles: ready ? milesValue : 0, packing, storageMonths: parseNumber(storage) || 0, unpacking }),
    [ready, cubicFeet, milesValue, packing, storage, unpacking],
  );

  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    markUsed();
  };

  const category = ready && milesValue <= 50 ? "local-moving" : "long-distance-moving";

  return (
    <CalculatorLayout
      label="Moving cost calculator"
      inputs={
        <>
          <FieldGroup legend="Your home">
            <SelectField label="Home size" value={size} onChange={(e) => change(setSize)(e.target.value as SizeChoice)} options={sizeOptions} supportingText="Typical volume per home size. Count room by room for a closer number." />
            {size === "custom" && (
              <TextField
                label="Total volume"
                inputMode="decimal"
                value={customFeet}
                onChange={(e) => change(setCustomFeet)(e.target.value)}
                trailing={<Unit>ft³</Unit>}
                supportingText={
                  <>
                    Not sure?{" "}
                    <Link href="/tools/cubic-feet-calculator" className="text-primary underline">
                      Use the cubic feet calculator
                    </Link>
                  </>
                }
              />
            )}
          </FieldGroup>

          <FieldGroup legend="Distance">
            <TextField label="Driving distance" inputMode="decimal" value={miles} onChange={(e) => change(setMiles)(e.target.value)} trailing={<Unit>miles</Unit>} supportingText="Door to door by road. Under 50 miles counts as a local move." />
          </FieldGroup>

          <FieldGroup legend="Packing service" hint="25% covers fragile items only, 50% is partial packing, 100% is full packing by the crew.">
            <SegmentedButton label="Packing service" value={packing} onChange={change(setPacking)} options={packingOptions} />
          </FieldGroup>

          <FieldGroup legend="Extras">
            <TextField label="Storage" inputMode="numeric" value={storage} onChange={(e) => change(setStorage)(e.target.value)} trailing={<Unit>months</Unit>} supportingText="Leave at 0 if your things go straight to the new home." />
            <Checkbox checked={unpacking} onCheckedChange={(v) => change(setUnpacking)(v === true)} label="Unpacking at the new home" className="mt-2" />
          </FieldGroup>
        </>
      }
      result={
        <ResultPanel
          eyebrow="Estimated total"
          footer={
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href={`/quote?category=${category}&src=tool-moving-cost`}>
                  Get real bids for this move
                  <Icon icon={arrowForwardIcon} size={20} />
                </Link>
              </Button>
              <p className="text-body-sm text-on-surface-variant">Free to post. You pay only if you accept a bid.</p>
            </div>
          }
        >
          {ready ? (
            <>
              <p className="mt-2 font-mono text-headline-md tracking-tight text-on-surface tabular-nums medium:text-headline-lg">{fmtRange(estimate.total.low, estimate.total.high)}</p>
              <p className="mt-2 text-body-md text-on-surface-variant">Rough estimate — carriers set the real price in their bids.</p>
              <ResultRows
                rows={[
                  { label: "Volume", value: `${num.format(estimate.cubicFeet)} ft³` },
                  { label: "Transport", value: fmtRange(estimate.transport.low, estimate.transport.high) },
                  { label: "Packing", value: fmtRange(estimate.packing.low, estimate.packing.high), hidden: estimate.packing.high === 0 },
                  { label: "Unpacking", value: fmtRange(estimate.unpacking.low, estimate.unpacking.high), hidden: estimate.unpacking.high === 0 },
                  { label: "Storage", value: fmtRange(estimate.storage.low, estimate.storage.high), hidden: estimate.storage.high === 0 },
                  { label: "Carrier price", value: fmtRange(estimate.carrierTotal.low, estimate.carrierTotal.high), strong: true },
                  { label: "AllShip service fee, 10%", value: fmtRange(estimate.serviceFee.low, estimate.serviceFee.high) },
                ]}
              />
            </>
          ) : (
            <p className="mt-2 text-body-lg text-on-surface-variant">Enter a volume and a distance to see a range.</p>
          )}
        </ResultPanel>
      }
    />
  );
}
