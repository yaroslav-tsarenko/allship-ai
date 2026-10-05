"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

export type BoardRow = {
  id: string;
  title: string;
  category: string;
  group: string;
  from: string;
  to: string;
  pickupState: string | null;
  pickup: string;
  pickupAt: number;
  bids: number;
  closes: string;
  closesAt: number;
};

type Sort = "closing" | "pickup" | "bids";

const PAGE = 25;

const sorts: Record<Sort, { label: string; fn: (a: BoardRow, b: BoardRow) => number }> = {
  closing: { label: "Bidding closes soonest", fn: (a, b) => a.closesAt - b.closesAt },
  pickup: { label: "Earliest pickup", fn: (a, b) => a.pickupAt - b.pickupAt },
  bids: { label: "Fewest bids", fn: (a, b) => a.bids - b.bids || a.closesAt - b.closesAt },
};

const columns = "expanded:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.9fr)]";

export function LoadBoard({ rows, groups, arrow, empty }: { rows: BoardRow[]; groups: { key: string; label: string }[]; arrow: ReactNode; empty: ReactNode }) {
  const [group, setGroup] = useState("all");
  const [state, setState] = useState("all");
  const [sort, setSort] = useState<Sort>("closing");
  const [limit, setLimit] = useState(PAGE);

  const states = useMemo(() => Array.from(new Set(rows.map((r) => r.pickupState).filter((s): s is string => Boolean(s)))).sort(), [rows]);
  const counts = useMemo(() => rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.group]: (acc[r.group] ?? 0) + 1 }), {}), [rows]);
  const filtered = useMemo(
    () => rows.filter((r) => (group === "all" || r.group === group) && (state === "all" || r.pickupState === state)).sort(sorts[sort].fn),
    [rows, group, state, sort],
  );
  const shown = filtered.slice(0, limit);

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div>
      <div className="flex flex-col gap-4 expanded:flex-row expanded:items-end expanded:justify-between">
        <div role="group" aria-label="Load type" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 medium:mx-0 medium:flex-wrap medium:px-0">
          <Chip variant="filter" label={`All ${rows.length}`} selected={group === "all"} onClick={() => (setGroup("all"), setLimit(PAGE))} />
          {groups
            .filter((g) => counts[g.key])
            .map((g) => (
              <Chip key={g.key} variant="filter" label={`${g.label} ${counts[g.key]}`} selected={group === g.key} onClick={() => (setGroup(g.key), setLimit(PAGE))} />
            ))}
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
            Pickup state
            <select
              value={state}
              onChange={(e) => (setState(e.target.value), setLimit(PAGE))}
              className="h-10 cursor-pointer rounded-xs border border-outline bg-surface px-3 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              <option value="all">Any state</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 cursor-pointer rounded-xs border border-outline bg-surface px-3 text-body-md text-on-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            >
              {(Object.keys(sorts) as Sort[]).map((k) => (
                <option key={k} value={k}>
                  {sorts[k].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "load" : "loads"} shown
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-outline-variant">
        <div className={`hidden gap-4 bg-surface-container-low px-6 py-3 text-label-lg text-on-surface-variant expanded:grid ${columns}`} aria-hidden="true">
          <span>Route</span>
          <span>What</span>
          <span>Pickup</span>
          <span>Bids</span>
          <span>Bidding closes</span>
        </div>
        {shown.length === 0 ? (
          <div role="status" className="px-6 py-14 text-center">
            <p className="text-title-lg text-on-surface">No open loads match these filters</p>
            <button type="button" onClick={() => (setGroup("all"), setState("all"))} className="mt-3 cursor-pointer rounded-xs text-title-sm font-medium text-primary underline-offset-4 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <ul>
            {shown.map((l) => (
              <li key={l.id} className={`grid gap-1 border-t border-outline-variant px-4 py-4 first:border-t-0 medium:px-6 expanded:items-center expanded:gap-4 expanded:first:border-t ${columns}`}>
                <p className="flex flex-wrap items-center gap-x-1.5 text-title-md text-on-surface">
                  <span>{l.from}</span>
                  {arrow}
                  <span>{l.to}</span>
                </p>
                <p className="min-w-0 text-body-md text-on-surface">
                  <span className="block truncate">{l.title}</span>
                  <span className="block text-body-sm text-on-surface-variant">{l.category}</span>
                </p>
                <p className="text-body-md text-on-surface-variant">
                  <span className="expanded:sr-only">Pickup </span>
                  {l.pickup}
                </p>
                <p className="text-body-md tabular-nums">
                  {l.bids === 0 ? <span className="text-primary">No bids yet</span> : <span className="text-on-surface-variant">{`${l.bids} ${l.bids === 1 ? "bid" : "bids"}`}</span>}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  <span className="expanded:sr-only">Bidding closes </span>
                  {l.closes}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-4 border-t border-outline-variant bg-surface-container-low px-4 py-5 medium:flex-row medium:items-center medium:justify-between medium:px-6">
          <p className="text-body-lg text-on-surface">
            {filtered.length > shown.length ? (
              <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="mr-2 cursor-pointer rounded-xs font-medium text-primary underline-offset-4 hover:underline">
                Show {Math.min(PAGE, filtered.length - shown.length)} more
              </button>
            ) : null}
            Verified carriers see full load details and bid in their account.
          </p>
          <Button asChild className="shrink-0 self-start medium:self-auto">
            <Link href="/sign-up?type=carrier" data-track="loads_board_signup">
              Sign up to bid
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
