"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  arrowForwardIcon,
  gavelIcon,
  inventory2Icon,
  travelExploreIcon,
} from "@/components/ui/icons.generated";
import { categories } from "@/content/categories";
import { formatUsd } from "@/lib/money";
import type { AssistantAction } from "@/server/ai/types";
import { announcePrefill, storeBidPrefill, storeLoadPrefill } from "./prefill";

export function startTour(tourId: string) {
  window.dispatchEvent(new CustomEvent("allship:start-tour", { detail: { tourId } }));
}

const place = (s?: { city?: string; state?: string; postalCode?: string }) =>
  [s?.city, s?.state].filter(Boolean).join(", ") || s?.postalCode || "";

export function ActionCard({
  action,
  onDone,
}: {
  action: AssistantAction;
  onDone: (kind: "navigate" | "tour") => void;
}) {
  const router = useRouter();

  if (action.type === "navigate") {
    if (!/^\/app(\/|$)/.test(action.href)) return null;
    return (
      <Button
        variant="tonal"
        size="sm"
        className="self-start"
        trailing={<Icon icon={arrowForwardIcon} size={18} />}
        onClick={() => {
          router.push(action.href);
          onDone("navigate");
        }}
      >
        {action.label}
      </Button>
    );
  }

  if (action.type === "start_tour") {
    return (
      <Button
        variant="tonal"
        size="sm"
        className="self-start"
        leading={<Icon icon={travelExploreIcon} size={18} />}
        onClick={() => {
          startTour(action.tourId);
          onDone("tour");
        }}
      >
        {action.label}
      </Button>
    );
  }

  if (action.type === "prefill_load") {
    const p = action.prefill;
    const category = categories.find((c) => c.key === p.category);
    const from = place(p.pickup);
    const to = place(p.dropoff);
    return (
      <div className="border-outline-variant bg-surface flex flex-col gap-3 rounded-md border p-4">
        <div className="flex items-start gap-3">
          <span className="bg-secondary-container text-on-secondary-container mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm">
            <Icon icon={inventory2Icon} size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-label-md text-on-surface-variant">New load draft</p>
            <p className="text-title-sm text-on-surface">{p.title || category?.name || "Load"}</p>
            {(from || to) && (
              <p className="text-body-md text-on-surface-variant">
                {from || "Pickup to add"} → {to || "Delivery to add"}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="self-start"
          trailing={<Icon icon={arrowForwardIcon} size={18} />}
          onClick={() => {
            storeLoadPrefill(p);
            if (!announcePrefill("load")) router.push("/app/loads/new?prefill=ai");
            onDone("navigate");
          }}
        >
          {action.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-outline-variant bg-surface flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-secondary-container text-on-secondary-container mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm">
          <Icon icon={gavelIcon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-md text-on-surface-variant">Bid draft on {action.publicId}</p>
          <p className="text-title-md text-on-surface tabular-nums">
            {formatUsd(Math.round(action.amount * 100))}{" "}
            <span className="text-body-md text-on-surface-variant">you receive</span>
          </p>
          <p className="text-body-md text-on-surface-variant mt-1 line-clamp-3">{action.message}</p>
        </div>
      </div>
      <Button
        size="sm"
        className="self-start"
        trailing={<Icon icon={arrowForwardIcon} size={18} />}
        onClick={() => {
          storeBidPrefill(action.publicId, { amount: action.amount, message: action.message });
          if (!announcePrefill("bid", action.publicId))
            router.push(`/app/board/${action.publicId}?prefill=ai`);
          onDone("navigate");
        }}
      >
        {action.label}
      </Button>
    </div>
  );
}
