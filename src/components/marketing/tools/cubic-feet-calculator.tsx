"use client";

import * as Tabs from "@radix-ui/react-tabs";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { addIcon, arrowForwardIcon, removeIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { cubicFeetAssumptions, estimatedWeight, roomCubicFeet, rooms, suggestTruck, totalCubicFeet, type Quantities } from "./cubic-feet-math";
import { num, num1 } from "./rate-curve";
import { CalculatorLayout, ResultPanel, ResultRows, useTrackOnce } from "./tool-ui";

const MAX_QTY = 99;

export function CubicFeetCalculator() {
  const [qty, setQty] = useState<Quantities>({});
  const [room, setRoom] = useState(rooms[0]?.id ?? "living");
  const markUsed = useTrackOnce("cubic-feet");

  const set = (id: string, value: number) => {
    const v = Math.min(MAX_QTY, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
    setQty((q) => ({ ...q, [id]: v }));
    markUsed();
  };

  const total = totalCubicFeet(qty);
  const truck = suggestTruck(total);
  const itemCount = Object.values(qty).reduce((s, v) => s + (v > 0 ? v : 0), 0);
  const roundedTotal = Math.round(total);

  return (
    <CalculatorLayout
      label="Cubic feet calculator"
      inputs={
        <Tabs.Root value={room} onValueChange={setRoom} className="min-w-0">
          <Tabs.List aria-label="Rooms" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 medium:mx-0 medium:flex-wrap medium:px-0">
            {rooms.map((r) => {
              const sub = roomCubicFeet(r, qty);
              return (
                <Tabs.Trigger
                  key={r.id}
                  value={r.id}
                  className={cn(
                    "state-layer flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-outline px-4 text-label-lg font-medium whitespace-nowrap text-on-surface-variant",
                    "data-[state=active]:border-transparent data-[state=active]:bg-secondary-container data-[state=active]:text-on-secondary-container",
                  )}
                >
                  {r.name}
                  {sub > 0 && <span className="font-mono text-label-md tabular-nums">{num1.format(sub)}</span>}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
          {rooms.map((r) => (
            <Tabs.Content key={r.id} value={r.id} className="mt-6 outline-none">
              <h2 className="sr-only">{r.name}</h2>
              <ul className="border-t border-outline-variant">
                {r.items.map((item) => {
                  const value = qty[item.id] ?? 0;
                  const inputId = `qty-${item.id}`;
                  return (
                    <li key={item.id} className={cn("flex items-center gap-3 border-b border-outline-variant py-2", value > 0 && "bg-surface-container-lowest")}>
                      <label htmlFor={inputId} className="min-w-0 flex-1 py-2">
                        <span className="block text-body-lg text-on-surface">{item.name}</span>
                        <span className="block font-mono text-body-sm text-on-surface-variant tabular-nums">{num1.format(item.cubicFeet)} ft³ each</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <IconButton icon={removeIcon} label={`One fewer ${item.name.toLowerCase()}`} disabled={value === 0} onClick={() => set(item.id, value - 1)} />
                        <input
                          id={inputId}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_QTY}
                          value={value}
                          onChange={(e) => set(item.id, e.target.value === "" ? 0 : Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="h-10 w-12 rounded-xs border border-outline-variant bg-transparent text-center font-mono text-body-lg text-on-surface tabular-nums outline-none [appearance:textfield] focus:border-2 focus:border-primary [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <IconButton icon={addIcon} label={`One more ${item.name.toLowerCase()}`} disabled={value >= MAX_QTY} onClick={() => set(item.id, value + 1)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Tabs.Content>
          ))}
          <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center justify-between gap-4 border-t border-outline-variant bg-surface px-4 py-3 expanded:hidden" aria-hidden="true">
            <span className="font-mono text-title-lg text-on-surface tabular-nums">{num.format(roundedTotal)} ft³</span>
            <span className="text-body-md text-on-surface-variant">{truck ? (truck.count > 1 ? `${truck.count} × ${truck.size} trucks` : `${truck.size} truck`) : "Add items"}</span>
          </div>
        </Tabs.Root>
      }
      result={
        <ResultPanel
          eyebrow="Total volume"
          footer={
            <div className="flex flex-col gap-2">
              <Button asChild size="lg">
                <Link href={roundedTotal > 0 ? `/tools/moving-cost-calculator?ft3=${roundedTotal}` : "/tools/moving-cost-calculator"}>
                  Estimate the moving cost
                  <Icon icon={arrowForwardIcon} size={20} />
                </Link>
              </Button>
              <Button asChild variant="text">
                <Link href="/quote?category=long-distance-moving&src=tool-cubic-feet">Post the move and get bids</Link>
              </Button>
              {itemCount > 0 && (
                <Button variant="text" onClick={() => setQty({})}>
                  Clear all items
                </Button>
              )}
            </div>
          }
        >
          <p className="mt-2 font-mono text-display-sm tracking-tight text-on-surface tabular-nums">
            {num.format(roundedTotal)} <span className="text-headline-sm text-on-surface-variant">ft³</span>
          </p>
          {truck ? (
            <>
              <p className="mt-3 text-title-md text-on-surface">
                {truck.count > 1 ? `${truck.count} × ${truck.size} trucks, or one tractor-trailer` : `Fits a ${truck.size} truck`}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-highest" role="meter" aria-label="Truck space used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(truck.fillShare * 100)}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, truck.fillShare * 100)}%` }} />
              </div>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                About {Math.round(truck.fillShare * 100)}% of {num.format(truck.capacity)} ft³ of cargo space
              </p>
            </>
          ) : (
            <p className="mt-3 text-body-md text-on-surface-variant">Add items from each room. The total and truck size update as you go.</p>
          )}
          <ResultRows
            rows={[
              { label: "Items", value: num.format(itemCount) },
              { label: `Estimated weight at ${cubicFeetAssumptions.poundsPerCubicFoot} lb/ft³`, value: `${num.format(estimatedWeight(total))} lb` },
              ...rooms
                .map((r) => ({ label: r.name, value: `${num1.format(roomCubicFeet(r, qty))} ft³`, hidden: roomCubicFeet(r, qty) === 0 }))
                .filter((r) => !r.hidden),
            ]}
          />
        </ResultPanel>
      }
    />
  );
}
