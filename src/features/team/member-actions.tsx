"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { personRemoveIcon } from "@/components/ui/icons.generated";
import { cancelInvitationAction, removeMemberAction, resendInvitationAction, updateMemberRoleAction } from "@/server/actions/team";

export function MemberRoleSelect({ memberId, name, role }: { memberId: string; name: string; role: "dispatcher" | "driver" }) {
  const { executeAsync, isPending } = useAction(updateMemberRoleAction);
  const [value, setValue] = useState(role);
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Role for {name}</span>
      <select
        value={value}
        disabled={isPending}
        onChange={async (event) => {
          const next = event.target.value as "dispatcher" | "driver";
          const previous = value;
          setValue(next);
          const result = await executeAsync({ memberId, role: next });
          if (result?.serverError) {
            setValue(previous);
            toast.error(result.serverError);
            return;
          }
          toast(`${name} is now a ${next}`);
        }}
        className="state-layer h-8 cursor-pointer appearance-none rounded-sm border border-outline-variant bg-transparent pr-8 pl-3 text-label-lg text-on-surface outline-none focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 [&>option]:bg-surface-container"
      >
        <option value="driver">Driver</option>
        <option value="dispatcher">Dispatcher</option>
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-on-surface-variant" />
    </label>
  );
}

export function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const { executeAsync, isPending } = useAction(removeMemberAction);
  return (
    <>
      <IconButton icon={personRemoveIcon} label={`Remove ${name}`} onClick={() => setOpen(true)} />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Remove ${name}?`}
        description="They lose access to your company's trips right away. Upcoming trips assigned to them go back to unassigned so you can pick another driver."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isPending}
              onClick={async () => {
                const result = await executeAsync({ memberId });
                if (result?.serverError) {
                  toast.error(result.serverError);
                  return;
                }
                setOpen(false);
                toast(`${name} was removed from the team`);
              }}
            >
              Remove
            </Button>
          </>
        }
      />
    </>
  );
}

export function InvitationActions({ invitationId, email }: { invitationId: string; email: string }) {
  const resend = useAction(resendInvitationAction);
  const cancel = useAction(cancelInvitationAction);
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        variant="text"
        size="sm"
        loading={resend.isPending}
        disabled={cancel.isPending}
        onClick={async () => {
          const result = await resend.executeAsync({ invitationId });
          if (result?.serverError) return toast.error(result.serverError);
          toast(`Sent again to ${email}`);
        }}
      >
        Resend
      </Button>
      <Button
        variant="text"
        size="sm"
        loading={cancel.isPending}
        disabled={resend.isPending}
        onClick={async () => {
          const result = await cancel.executeAsync({ invitationId });
          if (result?.serverError) return toast.error(result.serverError);
          toast("Invitation cancelled");
        }}
        aria-label={`Cancel invitation for ${email}`}
      >
        Cancel
      </Button>
    </div>
  );
}
