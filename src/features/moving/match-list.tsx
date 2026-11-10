"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/money";
import type { Match, MatchRoute } from "@/server/matcher/service";
import type { BookingIcons } from "./booking";
import type { MoveRequestData } from "./schema";

type Results = { route: MatchRoute; volumeCuFt: number; matches: Match[]; requirements: string[]; request: MoveRequestData };

const labelText = { lowest_price: "Lowest price", top_rated: "Top rated" } as const;

function monogram(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Breakdown({ match, feePercent }: { match: Match; feePercent: number }) {
  return (
    <dl className="flex flex-col gap-2 text-body-md">
      {match.lines.map((l) => (
        <div key={l.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4">
          <dt className="text-on-surface">{l.label}</dt>
          <dd className="text-right text-on-surface tabular-nums">{formatUsd(l.cents)}</dd>
          <dd className="col-span-2 text-body-sm text-on-surface-variant">{l.detail}</dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-4 border-t border-outline-variant pt-2">
        <dt className="text-on-surface-variant">Mover&rsquo;s price</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(match.carrierCents)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">AllShip service fee ({feePercent}%)</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(match.platformFeeCents)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-outline-variant pt-2">
        <dt className="text-title-sm text-on-surface">Total</dt>
        <dd className="text-title-md text-on-surface tabular-nums">{formatUsd(match.shipperTotalCents)}</dd>
      </div>
    </dl>
  );
}

function MatchRow({ match, icons, feePercent, onChoose, first }: { match: Match; icons: BookingIcons; feePercent: number; onChoose: () => void; first: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const facts = [
    match.yearsInBusiness ? `${match.yearsInBusiness} ${match.yearsInBusiness === 1 ? "year" : "years"} in business` : null,
    match.completedLoads > 0 ? `${match.completedLoads} ${match.completedLoads === 1 ? "move" : "moves"} completed on AllShip` : null,
  ].filter(Boolean);
  return (
    <li className="grid gap-x-6 gap-y-4 border-b border-outline-variant py-6 last:border-b-0 medium:grid-cols-[56px_minmax(0,1fr)_auto]">
      <span aria-hidden="true" className={`hidden size-14 items-center justify-center rounded-md text-title-md medium:flex ${first ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container"}`}>
        {monogram(match.name)}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-title-lg text-on-surface">{match.name}</h3>
          {match.labels.map((l) => (
            <span key={l} className={`rounded-xs px-2 py-0.5 text-label-md ${l === "lowest_price" ? "bg-primary-container text-on-primary-container" : "bg-tertiary-container text-on-tertiary-container"}`}>
              {labelText[l]}
            </span>
          ))}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-on-surface-variant">
          {match.rating !== null ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-warning">{icons.star}</span>
              <span className="text-on-surface tabular-nums">{match.rating.toFixed(1)}</span>
              <span>
                · {match.reviewCount} {match.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </span>
          ) : (
            <span className="text-on-surface">New on AllShip</span>
          )}
          {match.verified ? (
            <span className="inline-flex items-center gap-1 text-on-surface">
              <span className="text-success">{icons.verified}</span>
              FMCSA verified
            </span>
          ) : (
            <span>Authority check pending</span>
          )}
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={panelId} className="mt-3 cursor-pointer text-label-lg font-medium text-primary">
          {open ? "Hide price breakdown" : "See price breakdown"}
        </button>
        <div id={panelId} hidden={!open} className="mt-3 max-w-[520px] rounded-md bg-surface-container-low p-4">
          <Breakdown match={match} feePercent={feePercent} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 medium:flex-col medium:items-end medium:justify-start">
        <p className="medium:text-right">
          <span className="block text-headline-sm text-on-surface tabular-nums">{formatUsd(match.shipperTotalCents)}</span>
          <span className="block text-body-sm text-on-surface-variant">total with {feePercent}% fee</span>
        </p>
        <Button onClick={onChoose} variant={first ? "filled" : "tonal"} aria-label={`Choose ${match.name} for ${formatUsd(match.shipperTotalCents)}`}>
          Choose
        </Button>
      </div>
    </li>
  );
}

export function MatchList({ results, icons, feePercent, onChoose, onRequestBids }: { results: Results; icons: BookingIcons; feePercent: number; onChoose: (m: Match) => void; onRequestBids: () => void }) {
  const { matches, requirements } = results;

  if (matches.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 id="results-heading" tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
            Movers will send you prices for this move
          </h2>
          <p className="mt-2 max-w-[60ch] text-body-lg text-pretty text-on-surface-variant">No mover has published instant rates for this route yet. Tell us where to reach you and verified movers who serve it send their bids, usually within a few hours.</p>
        </div>
        <ol className="grid gap-4 medium:grid-cols-3">
          {[
            ["Leave your contact", "Your move details are already filled in."],
            ["Movers send bids", "Each bid shows the price, dates and FMCSA status."],
            ["Pick one, pay into escrow", `The total includes our ${feePercent}% fee. The mover is paid after delivery.`],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-lg text-on-primary-container">
                {i + 1}
              </span>
              <span>
                <span className="block text-title-sm text-on-surface">{t}</span>
                <span className="block text-body-md text-pretty text-on-surface-variant">{b}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button size="lg" onClick={onRequestBids} className="h-14 w-full">
          Get prices from movers
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 id="results-heading" tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
        {matches.length === 1 ? "1 mover can take your move" : `${matches.length} movers can take your move`}
      </h2>
      <p className="mt-1 text-body-md text-on-surface-variant">Sorted by total price, with our {feePercent}% fee included. Nothing is charged now.</p>
      {requirements.length > 0 && (
        <p className="mt-4 flex gap-2 rounded-md bg-surface-container-low p-4 text-body-md text-on-surface-variant">
          <span className="mt-px shrink-0">{icons.info}</span>
          <span>{requirements.join(", ")}. These go to the mover with your booking and aren&rsquo;t in the price.</span>
        </p>
      )}
      <ul className="mt-2">
        {matches.map((m, i) => (
          <MatchRow key={m.carrierOrgId} match={m} icons={icons} feePercent={feePercent} first={i === 0} onChoose={() => onChoose(m)} />
        ))}
      </ul>
      <button type="button" onClick={onRequestBids} className="mt-2 w-fit cursor-pointer text-label-lg font-medium text-primary">
        None of these? Get bids from more movers
      </button>
    </div>
  );
}
