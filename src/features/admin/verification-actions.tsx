"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { checkIcon, closeIcon, ruleIcon } from "@/components/ui/icons.generated";
import { Icon } from "@/components/ui/icon";
import { TextArea } from "@/components/ui/text-area";
import { setCarrierVerificationAction } from "@/server/actions/marketplace";

type Decision = "verified" | "failed" | "manual_review";

const copy: Record<Decision, { title: string; description: string; confirm: string; done: string }> = {
  verified: { title: "Approve this carrier?", description: "The company can bid on open loads right away. Owners and dispatchers get an email.", confirm: "Approve", done: "Carrier approved" },
  failed: { title: "Reject verification?", description: "The carrier can't bid until they fix their details. Your note is sent to the company owner and dispatchers.", confirm: "Reject", done: "Verification rejected" },
  manual_review: { title: "Send to manual review?", description: "Keeps the carrier out of the board while someone checks the record by hand. The carrier isn't notified.", confirm: "Mark for review", done: "Marked for manual review" },
};

export function VerificationActions({ orgId, status, companyName }: { orgId: string; status: string; companyName: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const { executeAsync, isPending } = useAction(setCarrierVerificationAction);

  const open = (d: Decision) => {
    setDecision(d);
    setNote("");
    setError(undefined);
  };

  const submit = async () => {
    if (!decision) return;
    const trimmed = note.trim();
    if (decision === "failed" && trimmed.length < 10) return setError("Tell the carrier what to fix, at least 10 characters");
    const result = await executeAsync({ orgId, status: decision, note: trimmed || undefined });
    if (result?.serverError) return toast.error(result.serverError);
    if (result?.validationErrors) return toast.error("Check the note and try again.");
    toast(copy[decision].done);
    setDecision(null);
    router.refresh();
  };

  const current = decision ? copy[decision] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => open("verified")} disabled={status === "verified"} leading={<Icon icon={checkIcon} size={18} />}>
          Approve
        </Button>
        <Button variant="outlined" onClick={() => open("manual_review")} disabled={status === "manual_review"} leading={<Icon icon={ruleIcon} size={18} />}>
          Manual review
        </Button>
        <Button variant="text" className="text-error" onClick={() => open("failed")} disabled={status === "failed"} leading={<Icon icon={closeIcon} size={18} />}>
          Reject
        </Button>
      </div>
      <Dialog
        open={decision !== null}
        onOpenChange={(o) => !o && setDecision(null)}
        title={current?.title ?? ""}
        description={current ? <>{current.description} <span className="text-on-surface">{companyName}</span></> : undefined}
        actions={
          <>
            <Button variant="text" onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button variant={decision === "failed" ? "danger" : "filled"} onClick={submit} loading={isPending}>
              {current?.confirm}
            </Button>
          </>
        }
      >
        <TextArea
          label={decision === "failed" ? "Reason for the carrier" : "Internal note (optional)"}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setError(undefined);
          }}
          maxLength={500}
          showCount
          rows={3}
          required={decision === "failed"}
          error={error}
          supportingText={decision === "failed" ? "For example: the legal name doesn't match the FMCSA record for this USDOT number." : "Saved to the audit log."}
        />
      </Dialog>
    </>
  );
}
