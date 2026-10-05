"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { flagIcon, lockClockIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { TextArea } from "@/components/ui/text-area";
import { PhotoUploader } from "@/features/uploads/photo-uploader";
import { openDisputeAction } from "@/server/actions/trips";
import { disputeReasonLabels, reasonsByRole, type DisputeReasonValue } from "./reasons";

const MIN_DETAILS = 30;

type Props = {
  loadId: string;
  role: "shipper" | "carrier";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerClassName?: string;
};

export function DisputeDialog({ loadId, role, open: controlled, onOpenChange, triggerLabel = "Report a problem", triggerVariant = "outlined", triggerClassName }: Props) {
  const router = useRouter();
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const setOpen = (next: boolean) => {
    if (controlled === undefined) setInternal(next);
    if (!next) setEvidence([]);
    onOpenChange?.(next);
  };
  const [reason, setReason] = useState<DisputeReasonValue | "">("");
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; details?: string }>({});
  const { executeAsync, isPending } = useAction(openDisputeAction);

  const submit = async () => {
    const next: typeof errors = {};
    if (!reason) next.reason = "Choose what went wrong";
    if (details.trim().length < MIN_DETAILS) next.details = `Add a few more details (at least ${MIN_DETAILS} characters)`;
    setErrors(next);
    if (next.reason || next.details || !reason) return;
    const res = await executeAsync({ loadId, reason, details: details.trim(), evidence: evidence.length ? evidence : undefined });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.validationErrors) return void toast.error("Check the form and try again.");
    toast.success(role === "shipper" ? "Problem reported. Payment is on hold while we review." : "Problem reported. Our team will review it.");
    setOpen(false);
    setReason("");
    setDetails("");
    setEvidence([]);
    router.refresh();
  };

  const remaining = Math.max(0, MIN_DETAILS - details.trim().length);

  return (
    <>
      {controlled === undefined && (
        <Button variant={triggerVariant} className={triggerClassName} onClick={() => setOpen(true)} leading={<Icon icon={flagIcon} size={20} />}>
          {triggerLabel}
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Report a problem"
        description={role === "shipper" ? "Tell us what went wrong. Our team reviews both sides before any money moves." : "Tell us what went wrong with this load. Our team reviews both sides."}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} loading={isPending} disabled={uploading}>
              Report problem
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-md bg-surface-container-highest p-4">
          <Icon icon={lockClockIcon} size={20} className="mt-0.5 shrink-0 text-on-surface-variant" />
          <p className="text-body-md text-on-surface-variant">
            {role === "shipper"
              ? "The payment stays in escrow and the carrier isn't paid until the dispute is resolved. We usually respond within one business day."
              : "The shipper's payment stays in escrow while we review, so nothing is refunded or released until we decide."}
          </p>
        </div>
        <SelectField
          label="What went wrong?"
          required
          value={reason}
          error={errors.reason}
          placeholder="Choose a reason"
          options={reasonsByRole[role].map((value) => ({ value, label: disputeReasonLabels[value] }))}
          onChange={(e) => {
            setReason(e.target.value as DisputeReasonValue);
            setErrors((x) => ({ ...x, reason: undefined }));
          }}
        />
        <TextArea
          label="What happened"
          required
          rows={5}
          maxLength={4000}
          value={details}
          error={errors.details}
          supportingText={remaining > 0 ? `${remaining} more characters needed. Include times, what you saw and what you expected.` : "Include times, what you saw and what you expected."}
          onChange={(e) => {
            setDetails(e.target.value);
            setErrors((x) => ({ ...x, details: undefined }));
          }}
        />
        <PhotoUploader
          loadId={loadId}
          purpose="dispute"
          max={6}
          allowPdf
          label="Evidence (optional)"
          description="Photos of damage, the bill of lading or receipts. Up to 6 files, 15 MB each."
          onChange={setEvidence}
          onBusyChange={setUploading}
        />
      </Dialog>
    </>
  );
}
