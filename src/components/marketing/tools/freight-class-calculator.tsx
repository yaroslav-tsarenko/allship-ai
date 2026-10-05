"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import { calculateFreightClass, densityRangeLabel, densityScale } from "./freight-class-math";
import { num, num2 } from "./rate-curve";
import { CalculatorLayout, FieldGroup, parseNumber, ResultPanel, ResultRows, Unit, useTrackOnce } from "./tool-ui";

export function FreightClassCalculator() {
  const [length, setLength] = useState("48");
  const [width, setWidth] = useState("40");
  const [height, setHeight] = useState("48");
  const [weight, setWeight] = useState("500");
  const [pieces, setPieces] = useState("1");
  const markUsed = useTrackOnce("freight-class");

  const result = useMemo(
    () => calculateFreightClass({ lengthIn: parseNumber(length), widthIn: parseNumber(width), heightIn: parseNumber(height), weightLb: parseNumber(weight), pieces: parseNumber(pieces) }),
    [length, width, height, weight, pieces],
  );

  const bind = (value: string, setter: (v: string) => void) => ({
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      markUsed();
    },
  });

  return (
    <CalculatorLayout
      label="Freight class calculator"
      inputs={
        <>
          <FieldGroup legend="Dimensions of one piece" hint="Measure at the outermost points, including the pallet and any overhang.">
            <div className="grid grid-cols-3 gap-3">
              <TextField label="Length" inputMode="decimal" trailing={<Unit>in</Unit>} {...bind(length, setLength)} />
              <TextField label="Width" inputMode="decimal" trailing={<Unit>in</Unit>} {...bind(width, setWidth)} />
              <TextField label="Height" inputMode="decimal" trailing={<Unit>in</Unit>} {...bind(height, setHeight)} />
            </div>
          </FieldGroup>
          <FieldGroup legend="Weight and count">
            <div className="grid gap-3 medium:grid-cols-2">
              <TextField label="Weight per piece" inputMode="decimal" trailing={<Unit>lb</Unit>} supportingText="Include pallet and packaging." {...bind(weight, setWeight)} />
              <TextField label="Pieces" inputMode="numeric" supportingText="Identical pallets or crates." {...bind(pieces, setPieces)} />
            </div>
          </FieldGroup>

          <div>
            <h2 className="text-title-sm text-on-surface">NMFC density scale</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-body-md">
                <caption className="sr-only">Density brackets and the freight class each one maps to</caption>
                <thead>
                  <tr className="border-b border-outline">
                    <th scope="col" className="py-2 pr-4 font-medium text-on-surface">
                      Density
                    </th>
                    <th scope="col" className="py-2 font-medium text-on-surface">
                      Class
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...densityScale].reverse().map((row) => {
                    const active = result?.freightClass === row.freightClass;
                    return (
                      <tr key={row.freightClass} aria-current={active ? "true" : undefined} className={cn("border-b border-outline-variant", active && "bg-primary-container text-on-primary-container")}>
                        <td className={cn("py-2 pr-4 pl-3", active ? "font-medium" : "text-on-surface-variant")}>{densityRangeLabel(row.freightClass)}</td>
                        <td className={cn("py-2 pr-3 font-mono tabular-nums", active ? "font-medium" : "text-on-surface")}>{row.freightClass}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      }
      result={
        <ResultPanel
          eyebrow="Density-based class"
          footer={
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href="/quote?category=freight&src=tool-freight-class">
                  Get freight bids
                  <Icon icon={arrowForwardIcon} size={20} />
                </Link>
              </Button>
              <p className="text-body-sm text-on-surface-variant">Add the class and dimensions to your load so carriers can price it.</p>
            </div>
          }
        >
          {result ? (
            <>
              <p className="mt-2 font-mono text-display-sm tracking-tight text-on-surface tabular-nums">Class {result.freightClass}</p>
              <p className="mt-2 text-body-md text-on-surface-variant">{densityRangeLabel(result.freightClass)}. The commodity&apos;s NMFC listing can set a different class.</p>
              <ResultRows
                rows={[
                  { label: "Density", value: `${num2.format(result.density)} lb/ft³`, strong: true },
                  { label: "Volume per piece", value: `${num2.format(result.cubicFeetPerPiece)} ft³` },
                  { label: "Total volume", value: `${num2.format(result.totalCubicFeet)} ft³` },
                  { label: "Total weight", value: `${num.format(result.totalWeight)} lb` },
                ]}
              />
            </>
          ) : (
            <p className="mt-2 text-body-lg text-on-surface-variant">Enter all three dimensions, a weight and at least one piece.</p>
          )}
        </ResultPanel>
      }
    />
  );
}
