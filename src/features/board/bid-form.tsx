"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { lockIcon } from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { clearPrefillParam, onPrefill, takeBidPrefill, type BidPrefill } from "@/features/assistant/prefill";
import { AiPrefillNote } from "@/features/assistant/prefill-note";
import { bidInputSchema } from "@/features/loads/schema";
import { feeFor, formatUsd } from "@/lib/money";
import { placeBidAction, withdrawBidAction } from "@/server/actions/marketplace";
import { formatDay } from "./format";

type Values = z.input<typeof bidInputSchema>;
type Output = z.output<typeof bidInputSchema>;

export type ExistingBid = { id: string; amountCents: number; estimatedPickupAt: string; estimatedDeliveryAt: string; message: string; createdAt: string };

const MIN_MESSAGE = 80;

function valuesFor(loadId: string, bid: ExistingBid | null, defaults: { pickup: string; delivery: string }): Values {
  return bid
    ? { loadId, amount: String(bid.amountCents / 100), estimatedPickupAt: bid.estimatedPickupAt.slice(0, 10), estimatedDeliveryAt: bid.estimatedDeliveryAt.slice(0, 10), message: bid.message, aiAssisted: false }
    : { loadId, amount: "", estimatedPickupAt: defaults.pickup, estimatedDeliveryAt: defaults.delivery, message: "", aiAssisted: false };
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BidForm({
  loadId,
  feeBps,
  activeBid,
  lapsed,
  defaults,
  disabledReason,
}: {
  loadId: string;
  feeBps: number;
  activeBid: ExistingBid | null;
  lapsed: string | null;
  defaults: { pickup: string; delivery: string };
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(!activeBid);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const pathname = usePathname();
  const [refreshing, startRefresh] = useTransition();
  const place = useAction(placeBidAction);
  const withdraw = useAction(withdrawBidAction);
  const min = today();

  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(bidInputSchema),
    defaultValues: valuesFor(loadId, activeBid, defaults),
  });
  const { errors } = form.formState;
  const amount = Number(useWatch({ control: form.control, name: "amount" }));
  const message = String(useWatch({ control: form.control, name: "message" }) ?? "");
  const cents = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
  const split = feeFor(cents, feeBps);
  const feePct = `${(feeBps / 100).toLocaleString("en-US")}%`;
  const remaining = MIN_MESSAGE - message.trim().length;

  useEffect(() => {
    const publicId = pathname.match(/^\/app\/board\/(AS-[A-Z0-9]{4,10})/)?.[1];
    if (!publicId || disabledReason) return;
    const apply = (prefill: BidPrefill | null) => {
      if (!prefill) return false;
      setEditing(true);
      if (prefill.amount) form.setValue("amount", String(prefill.amount), { shouldDirty: true, shouldValidate: true });
      if (prefill.message) form.setValue("message", prefill.message, { shouldDirty: true, shouldValidate: true });
      form.setValue("aiAssisted", true);
      setAiFilled(true);
      clearPrefillParam();
      return true;
    };
    const off = onPrefill("bid", (id) => id === publicId && apply(takeBidPrefill(publicId, true)));
    apply(takeBidPrefill(publicId));
    return off;
  }, [pathname, disabledReason, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.estimatedDeliveryAt < values.estimatedPickupAt) {
      form.setError("estimatedDeliveryAt", { message: "Delivery can't be before pickup" });
      return;
    }
    const result = await place.executeAsync(values);
    if (result?.serverError) return toast.error(result.serverError);
    if (result?.validationErrors) return toast.error("Check the highlighted fields.");
    toast(result?.data?.updated ? "Bid updated" : "Bid placed. We'll notify you when the shipper decides.");
    startRefresh(() => {
      setEditing(false);
      router.refresh();
    });
  });

  const onWithdraw = async () => {
    if (!activeBid) return;
    const result = await withdraw.executeAsync({ bidId: activeBid.id });
    setConfirmWithdraw(false);
    if (result?.serverError) return toast.error(result.serverError);
    toast("Bid withdrawn");
    form.reset(valuesFor(loadId, null, defaults));
    startRefresh(() => {
      setEditing(true);
      router.refresh();
    });
  };

  if (disabledReason) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-title-lg text-on-surface">Place a bid</h2>
        <div className="flex gap-3 rounded-sm bg-surface-container-high p-4">
          <Icon icon={lockIcon} size={20} className="mt-0.5 shrink-0 text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">{disabledReason}</p>
        </div>
      </div>
    );
  }

  if (activeBid && !editing) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-title-lg text-on-surface">Your bid</h2>
          <StatusChip tone="secondary" size="sm" dot>
            Active
          </StatusChip>
        </div>
        <p className="text-display-sm text-on-surface tabular-nums">{formatUsd(activeBid.amountCents, true)}</p>
        <dl className="grid grid-cols-2 gap-3 text-body-md">
          <div>
            <dt className="text-on-surface-variant">Pickup</dt>
            <dd className="text-on-surface">{formatDay(activeBid.estimatedPickupAt, true)}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">Delivery</dt>
            <dd className="text-on-surface">{formatDay(activeBid.estimatedDeliveryAt, true)}</dd>
          </div>
        </dl>
        <p className="text-body-md whitespace-pre-line text-on-surface-variant">{activeBid.message}</p>
        <p className="text-body-sm text-on-surface-variant">
          Placed {formatDay(activeBid.createdAt, true)}. The shipper sees your price, dates and message, plus your company rating.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={() => {
              form.reset(valuesFor(loadId, activeBid, defaults));
              setEditing(true);
            }}
          >
            Update bid
          </Button>
          <Button variant="text" onClick={() => setConfirmWithdraw(true)}>
            Withdraw
          </Button>
        </div>
        <Dialog
          open={confirmWithdraw}
          onOpenChange={setConfirmWithdraw}
          title="Withdraw this bid?"
          description="The shipper won't be able to accept it. You can bid again while the load is open."
          actions={
            <>
              <Button variant="text" onClick={() => setConfirmWithdraw(false)}>
                Keep bid
              </Button>
              <Button variant="text" className="text-error" loading={withdraw.isPending} onClick={onWithdraw}>
                Withdraw
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <h2 className="text-title-lg text-on-surface">{activeBid ? "Update your bid" : "Place a bid"}</h2>
        {lapsed && !activeBid && <p className="mt-1 text-body-md text-on-surface-variant">{lapsed}</p>}
      </div>
      {aiFilled && <AiPrefillNote onDismiss={() => setAiFilled(false)} />}
      <input type="hidden" {...form.register("loadId")} />
      <TextField
        label="Your price"
        data-tour="bid-amount"
        type="number"
        inputMode="decimal"
        min={25}
        step="1"
        leading={<span className="text-body-lg">$</span>}
        error={errors.amount?.message}
        {...form.register("amount")}
      />
      <div data-tour="bid-breakdown" className="rounded-sm bg-surface-container-low px-4 py-3 text-body-md" aria-live="polite">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-on-surface-variant">You receive</span>
          <span className="text-title-md text-on-surface tabular-nums">
            {formatUsd(split.carrierAmountCents)} <span className="text-body-sm text-on-surface-variant">100%</span>
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-on-surface-variant">Shipper pays</span>
          <span className="text-on-surface-variant tabular-nums">
            {formatUsd(split.carrierAmountCents)} + {feePct} fee = <span className="text-on-surface">{formatUsd(split.shipperTotalCents)}</span>
          </span>
        </div>
      </div>
      <div className="grid gap-4 medium:grid-cols-2">
        <TextField label="Pickup by" type="date" min={min} error={errors.estimatedPickupAt?.message} {...form.register("estimatedPickupAt")} />
        <TextField label="Deliver by" type="date" min={min} error={errors.estimatedDeliveryAt?.message} {...form.register("estimatedDeliveryAt")} />
      </div>
      <TextArea
        label="Message to the shipper"
        data-tour="bid-message"
        rows={5}
        maxLength={2000}
        showCount
        error={errors.message?.message}
        supportingText={remaining > 0 ? `${remaining} more ${remaining === 1 ? "character" : "characters"} needed` : "Equipment, insurance and anything included in your price"}
        {...form.register("message")}
      />
      <Button type="submit" size="lg" data-tour="bid-submit" loading={place.isPending || refreshing}>
        {activeBid ? "Save changes" : "Place bid"}
      </Button>
      {activeBid && (
        <Button
          type="button"
          variant="text"
          onClick={() => {
            form.reset();
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      )}
      <p className="text-body-sm text-on-surface-variant">You&apos;re paid your full bid after the shipper confirms delivery. The shipper&apos;s payment waits in escrow until then.</p>
    </form>
  );
}
