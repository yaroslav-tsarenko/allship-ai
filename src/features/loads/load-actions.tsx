"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip, ChipSet } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { cancelIcon, lockClockIcon, replayIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { TextArea } from "@/components/ui/text-area";
import { formatUsd } from "@/lib/money";
import { cancelLoadAction, relistLoadAction } from "@/server/actions/marketplace";
import { PaymentStep, type PaymentInfo } from "./payment-step";
import { biddingDayOptions } from "./wizard-model";

const reasons = ["My plans changed", "I found another way to ship it", "Bids were too high", "Dates no longer work"];

export function CancelLoadButton({ loadId, isDraft }: { loadId: string; isDraft: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const { executeAsync, isPending } = useAction(cancelLoadAction);

  const submit = async () => {
    if (reason.trim().length < 3) return setError("Tell carriers why, in a few words");
    const res = await executeAsync({ loadId, reason: reason.trim() });
    if (res?.serverError) return void toast.error(res.serverError);
    toast(isDraft ? "Draft deleted" : "Load cancelled. Carriers who bid have been told.");
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)} leading={<Icon icon={cancelIcon} size={20} />}>
        {isDraft ? "Discard draft" : "Cancel load"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isDraft ? "Discard this draft?" : "Cancel this load?"}
        description={isDraft ? "It moves to Past and can't be posted again." : "Bidding stops right away and every carrier who bid is notified. This can't be undone."}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={submit} loading={isPending}>
              {isDraft ? "Discard" : "Cancel load"}
            </Button>
          </>
        }
      >
        <ChipSet label="Common reasons">
          {reasons.map((r) => (
            <Chip
              key={r}
              variant="filter"
              label={r}
              selected={reason === r}
              onClick={() => {
                setReason(r);
                setError(undefined);
              }}
            />
          ))}
        </ChipSet>
        <TextArea
          className="[--field-bg:var(--md-surface-container-high)]"
          label="Reason"
          rows={3}
          maxLength={500}
          showCount
          value={reason}
          error={error}
          onChange={(e) => {
            setReason(e.target.value);
            setError(undefined);
          }}
        />
      </Dialog>
    </>
  );
}

export function RelistButton({ loadId }: { loadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("5");
  const { executeAsync, isPending } = useAction(relistLoadAction);

  const submit = async () => {
    const res = await executeAsync({ loadId, biddingDays: Number(days) });
    if (res?.serverError) return void toast.error(res.serverError);
    toast("Relisted. Carriers can bid again.");
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} leading={<Icon icon={replayIcon} size={20} />}>
        Relist
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Relist this load?"
        description="It goes back on the load board with the same details. Check the pickup dates are still right."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <Button onClick={submit} loading={isPending}>
              Relist
            </Button>
          </>
        }
      >
        <SelectField label="Accept bids for" options={biddingDayOptions} value={days} onChange={(e) => setDays(e.target.value)} required className="pt-2 [--field-bg:var(--md-surface-container-high)]" />
      </Dialog>
    </>
  );
}

export function ResumePaymentCard({ info, publicId, returning }: { info: PaymentInfo; publicId: string; returning: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="pay-title" className="flex flex-col gap-4 rounded-md bg-warning-container p-4 text-on-warning-container medium:flex-row medium:items-center medium:p-5">
      <Icon icon={lockClockIcon} size={28} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h2 id="pay-title" className="text-title-md">
          {returning ? "Confirming your payment" : `Finish paying to book ${info.carrierName ?? "your carrier"}`}
        </h2>
        <p className="text-body-md">
          {returning
            ? "Stripe is confirming the payment. This page updates once it clears, usually within a minute."
            : `${formatUsd(info.totalCents)} is due. We hold this carrier for 30 minutes from when you accepted.`}
        </p>
      </div>
      {!returning && (
        <Button onClick={() => setOpen(true)} className="self-start medium:self-center">
          Resume payment
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen} title="Pay to book" description={`Your payment is held in escrow and released to ${info.carrierName ?? "the carrier"} after delivery.`}>
        <PaymentStep info={info} publicId={publicId} onDone={() => setOpen(false)} />
      </Dialog>
    </section>
  );
}
