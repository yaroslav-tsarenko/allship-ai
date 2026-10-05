"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { formatUsd } from "@/lib/money";
import { resolveDisputeAction } from "@/server/actions/trips";

type Outcome = "release" | "refund" | "split";

type Props = {
  disputeId: string;
  carrierName: string;
  shipperName: string;
  totalCents: number;
  carrierAmountCents: number;
  refundedCents: number;
};

export function ResolveDisputeForm({ disputeId, carrierName, shipperName, totalCents, carrierAmountCents, refundedCents }: Props) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>("release");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; note?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const { executeAsync, isPending } = useAction(resolveDisputeAction);
  const feeCents = totalCents - carrierAmountCents;
  const refundable = totalCents - refundedCents;
  const splitCents = Math.round(Number(amount.replace(/[$,\s]/g, "")) * 100);

  const effects =
    outcome === "release"
      ? [`${formatUsd(carrierAmountCents)} is paid out to ${carrierName}.`, `${formatUsd(feeCents)} platform fee is kept.`, "The load is marked completed."]
      : outcome === "refund"
        ? [`${formatUsd(refundable)} is refunded to ${shipperName}, including the service fee.`, `${carrierName} receives nothing.`, "The load is cancelled."]
        : [
            `${formatUsd(Number.isFinite(splitCents) ? splitCents : 0)} is refunded to ${shipperName}.`,
            `${formatUsd(Math.max(0, carrierAmountCents - (Number.isFinite(splitCents) ? splitCents : 0)))} is paid out to ${carrierName}.`,
            `${formatUsd(feeCents)} platform fee is kept. The load is marked completed.`,
          ];

  const review = () => {
    const next: typeof errors = {};
    if (outcome === "split") {
      if (!amount.trim() || !Number.isFinite(splitCents) || splitCents <= 0) next.amount = "Enter the amount to refund in USD";
      else if (splitCents > carrierAmountCents) next.amount = `Can't be more than the carrier's ${formatUsd(carrierAmountCents)}`;
    }
    if (note.trim().length < 10) next.note = "Explain the decision in at least 10 characters. Both parties see it.";
    setErrors(next);
    if (!next.amount && !next.note) setConfirming(true);
  };

  const submit = async () => {
    const res = await executeAsync({ disputeId, outcome, refundCents: outcome === "split" ? splitCents : undefined, resolution: note.trim() });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.validationErrors) return void toast.error("Check the form and try again.");
    toast.success("Dispute resolved. Both parties were notified.");
    setConfirming(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <SegmentedButton
        label="Outcome"
        value={outcome}
        onChange={(v) => {
          setOutcome(v);
          setErrors({});
        }}
        options={[
          { value: "release", label: "Release" },
          { value: "refund", label: "Refund all" },
          { value: "split", label: "Split" },
        ]}
      />
      {outcome === "split" && (
        <TextField
          label="Refund to shipper (USD)"
          inputMode="decimal"
          value={amount}
          error={errors.amount}
          leading={<span className="text-body-lg">$</span>}
          supportingText={`Up to ${formatUsd(carrierAmountCents)}. The carrier gets the rest of their price.`}
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((x) => ({ ...x, amount: undefined }));
          }}
        />
      )}
      <ul className="flex flex-col gap-1 rounded-md bg-surface-container-low p-4 text-body-md text-on-surface">
        {effects.map((e) => (
          <li key={e} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface-variant" />
            {e}
          </li>
        ))}
      </ul>
      <TextArea
        label="Decision note"
        required
        rows={4}
        maxLength={2000}
        value={note}
        error={errors.note}
        supportingText="Sent to the shipper and carrier with the outcome."
        onChange={(e) => {
          setNote(e.target.value);
          setErrors((x) => ({ ...x, note: undefined }));
        }}
      />
      <Button onClick={review} className="self-start" variant={outcome === "refund" ? "danger" : "filled"}>
        Review and resolve
      </Button>
      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title={outcome === "release" ? "Pay the carrier?" : outcome === "refund" ? "Refund the shipper in full?" : "Split the payment?"}
        description="Money moves right away and this can't be undone."
        actions={
          <>
            <Button variant="text" onClick={() => setConfirming(false)}>
              Go back
            </Button>
            <Button onClick={submit} loading={isPending} variant={outcome === "refund" ? "danger" : "filled"}>
              Resolve dispute
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-1 text-body-md">
          {effects.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Dialog>
    </div>
  );
}
