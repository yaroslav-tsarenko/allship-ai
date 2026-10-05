"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { cancelIcon, replayIcon } from "@/components/ui/icons.generated";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { formatUsd } from "@/lib/money";
import { cancelBookedAction, retryPayoutAction } from "@/server/actions/trips";

export function RetryPayoutButton({ payoutId, label }: { payoutId: string; label: string }) {
  const router = useRouter();
  const { executeAsync, isPending } = useAction(retryPayoutAction);
  const retry = async () => {
    const res = await executeAsync({ payoutId });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.data?.paid) toast.success(`Transfer sent for ${label}.`);
    else toast.error(`Transfer for ${label} failed again. See the reason in the table.`);
    router.refresh();
  };
  return (
    <Button size="sm" variant="outlined" onClick={retry} loading={isPending} leading={<Icon icon={replayIcon} size={18} />} aria-label={`Retry transfer for ${label}`}>
      Retry
    </Button>
  );
}

export function CancelRefundButton({ loadId, totalCents, carrierAmountCents }: { loadId: string; totalCents: number | null; carrierAmountCents: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [keep, setKeep] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; keep?: string }>({});
  const { executeAsync, isPending } = useAction(cancelBookedAction);
  const keepCents = keep.trim() ? Math.round(Number(keep.replace(/[$,\s]/g, "")) * 100) : 0;

  const submit = async () => {
    const next: typeof errors = {};
    if (reason.trim().length < 10) next.reason = "Give a reason in at least 10 characters. Both parties see it.";
    if (!Number.isFinite(keepCents) || keepCents < 0) next.keep = "Enter an amount in USD, or leave it empty";
    else if (carrierAmountCents != null && keepCents > carrierAmountCents) next.keep = `Can't be more than the carrier's ${formatUsd(carrierAmountCents)}`;
    setErrors(next);
    if (next.reason || next.keep) return;
    const res = await executeAsync({ loadId, reason: reason.trim(), keepCents });
    if (res?.serverError) return void toast.error(res.serverError);
    toast.success("Load cancelled and refund issued.");
    setOpen(false);
    router.refresh();
  };

  const refundCents = totalCents != null ? Math.max(0, totalCents - (Number.isFinite(keepCents) ? keepCents : 0)) : null;

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} leading={<Icon icon={cancelIcon} size={20} />}>
        Cancel and refund
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel and refund this load?"
        description="Use this when the booking falls through before pickup. The shipper and carrier are notified."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button variant="danger" onClick={submit} loading={isPending}>
              Cancel and refund
            </Button>
          </>
        }
      >
        <TextArea
          label="Reason"
          required
          rows={3}
          maxLength={500}
          value={reason}
          error={errors.reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((x) => ({ ...x, reason: undefined }));
          }}
        />
        <TextField
          label="Keep for carrier (USD, optional)"
          inputMode="decimal"
          value={keep}
          error={errors.keep}
          leading={<span className="text-body-lg">$</span>}
          supportingText={carrierAmountCents != null ? `For example a dry-run fee. Up to ${formatUsd(carrierAmountCents)}.` : "No captured payment on this load."}
          onChange={(e) => {
            setKeep(e.target.value);
            setErrors((x) => ({ ...x, keep: undefined }));
          }}
        />
        {refundCents != null && (
          <p className="rounded-md bg-surface-container-low p-3 text-body-md text-on-surface">
            Shipper gets {formatUsd(refundCents)} back{keepCents > 0 && Number.isFinite(keepCents) ? `, carrier is paid ${formatUsd(keepCents)}, no platform fee` : ""}.
          </p>
        )}
      </Dialog>
    </>
  );
}
