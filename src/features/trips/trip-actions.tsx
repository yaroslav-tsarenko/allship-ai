"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { inventoryIcon, navigationIcon, taskAltIcon } from "@/components/ui/icons.generated";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { PhotoUploader } from "@/features/uploads/photo-uploader";
import { uploadBlob, UploadError } from "@/features/uploads/upload";
import { cn } from "@/lib/cn";
import { confirmDeliveryAction, confirmPickupAction, startTripAction } from "@/server/actions/trips";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

export type NextStep = "start" | "pickup" | "delivery";

function PickupDialog({ loadId, open, onOpenChange }: { loadId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { executeAsync, isPending } = useAction(confirmPickupAction);

  const submit = async () => {
    if (keys.length === 0) return setError("Add at least one photo of the shipment as loaded.");
    setError(null);
    const result = await executeAsync({ loadId, photoKeys: keys, note: note.trim() || undefined });
    if (result?.serverError) return setError(result.serverError);
    onOpenChange(false);
    toast("Pickup confirmed. The shipper has been notified.");
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
      title="Confirm pickup"
      description="Take photos of the shipment as it's loaded. The shipper sees them on their load page."
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={isPending} disabled={busy}>
            {busy ? "Uploading…" : "Confirm pickup"}
          </Button>
        </>
      }
    >
      <PhotoUploader loadId={loadId} purpose="pickup" max={8} label="Pickup photos" onChange={setKeys} onBusyChange={setBusy} />
      <TextArea label="Note (optional)" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} supportingText="Damage you noticed, extra items, anything the shipper should know." />
      {error && (
        <p role="alert" className="text-body-md text-error">
          {error}
        </p>
      )}
    </Dialog>
  );
}

function DeliveryDialog({ loadId, open, onOpenChange }: { loadId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ recipient?: string; form?: string }>({});
  const [signing, setSigning] = useState(false);
  const signature = useRef<SignaturePadHandle>(null);
  const { executeAsync, isPending } = useAction(confirmDeliveryAction);

  const submit = async () => {
    const next: typeof errors = {};
    if (recipient.trim().length < 2) next.recipient = "Who received the shipment?";
    if (keys.length === 0) next.form = "Add at least one proof-of-delivery photo.";
    setErrors(next);
    if (next.recipient || next.form) return;
    let signatureKey: string | undefined;
    const blob = await signature.current?.toBlob();
    if (blob) {
      setSigning(true);
      try {
        signatureKey = await uploadBlob({ loadId, purpose: "signature", blob, contentType: "image/png" });
      } catch (error) {
        setSigning(false);
        setErrors({ form: error instanceof UploadError ? `Signature didn't upload: ${error.message}` : "Signature didn't upload. Try again." });
        return;
      }
      setSigning(false);
    }
    const result = await executeAsync({ loadId, recipientName: recipient.trim(), photoKeys: keys, signatureKey, note: note.trim() || undefined });
    if (result?.serverError) return setErrors({ form: result.serverError });
    if (result?.validationErrors) return setErrors({ recipient: "Who received the shipment?" });
    onOpenChange(false);
    toast("Delivered. Payment releases once the shipper confirms.");
    router.refresh();
  };

  const working = isPending || signing;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !working && onOpenChange(next)}
      title="Confirm delivery"
      description="Proof of delivery protects you if anything is disputed later."
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)} disabled={working}>
            Cancel
          </Button>
          <Button onClick={submit} loading={working} disabled={busy}>
            {busy ? "Uploading…" : "Confirm delivery"}
          </Button>
        </>
      }
    >
      <TextField label="Received by" autoComplete="off" required value={recipient} onChange={(e) => setRecipient(e.target.value)} error={errors.recipient} supportingText="Full name of the person who accepted the shipment" />
      <PhotoUploader loadId={loadId} purpose="delivery" max={8} label="Delivery photos" description="The shipment at drop-off, plus any signed paperwork." allowPdf onChange={setKeys} onBusyChange={setBusy} />
      <SignaturePad ref={signature} />
      <TextArea label="Note (optional)" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      {errors.form && (
        <p role="alert" className="text-body-md text-error">
          {errors.form}
        </p>
      )}
    </Dialog>
  );
}

const stepCopy: Record<NextStep, { label: string; hint: string; icon: typeof navigationIcon }> = {
  start: { label: "Start trip", hint: "Tap when you're heading to pickup", icon: navigationIcon },
  pickup: { label: "Confirm pickup", hint: "Photos of the shipment as loaded", icon: inventoryIcon },
  delivery: { label: "Confirm delivery", hint: "Recipient name, photos and signature", icon: taskAltIcon },
};

export function TripNextStep({ loadId, step, className }: { loadId: string; step: NextStep; className?: string }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"pickup" | "delivery" | null>(null);
  const start = useAction(startTripAction);
  const copy = stepCopy[step];

  const onClick = async () => {
    if (step === "pickup" || step === "delivery") return setDialog(step);
    const result = await start.executeAsync({ loadId });
    if (result?.serverError) return toast.error(result.serverError);
    toast("Trip started. The shipper knows you're on the way.");
    router.refresh();
  };

  return (
    <>
      <div className={cn("flex items-center gap-3", className)}>
        <p className="hidden min-w-0 flex-1 text-body-md text-on-surface-variant medium:block">{copy.hint}</p>
        <Button size="lg" className="w-full medium:w-auto" leading={<Icon icon={copy.icon} size={22} />} loading={start.isPending} onClick={onClick}>
          {copy.label}
        </Button>
      </div>
      {dialog === "pickup" && <PickupDialog loadId={loadId} open onOpenChange={(open) => !open && setDialog(null)} />}
      {dialog === "delivery" && <DeliveryDialog loadId={loadId} open onOpenChange={(open) => !open && setDialog(null)} />}
    </>
  );
}
