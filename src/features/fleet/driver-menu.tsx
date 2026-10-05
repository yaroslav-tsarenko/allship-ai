"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  cancelIcon,
  forwardToInboxIcon,
  moreVertIcon,
  personIcon,
  personRemoveIcon,
} from "@/components/ui/icons.generated";
import { removeDriverAction, resendDriverSetupAction } from "@/server/actions/fleet";
import { cancelInvitationAction, resendInvitationAction } from "@/server/actions/team";
import type { FleetDriver } from "@/server/fleet/queries";
import { isOnTrip } from "@/server/fleet/status";

const menuItem =
  "state-layer flex h-12 cursor-pointer items-center gap-3 px-3 text-body-lg text-on-surface outline-none data-[highlighted]:bg-on-surface/8 data-[disabled]:cursor-not-allowed data-[disabled]:text-on-surface/38";

export function DriverMenu({
  driver,
  canRemove,
  onChanged,
}: {
  driver: FleetDriver;
  canRemove: boolean;
  onChanged: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const resendSetup = useAction(resendDriverSetupAction);
  const resendInvite = useAction(resendInvitationAction);
  const cancelInvite = useAction(cancelInvitationAction);
  const remove = useAction(removeDriverAction);
  const busy = isOnTrip(driver.status);
  const invited = driver.status === "invited";

  const resend = async () => {
    const result = driver.invitationId
      ? await resendInvite.executeAsync({ invitationId: driver.invitationId })
      : driver.userId
        ? await resendSetup.executeAsync({ userId: driver.userId })
        : null;
    if (result?.serverError) return toast.error(result.serverError);
    toast(`Sent a new link to ${driver.email}`);
  };

  const cancel = async () => {
    if (!driver.invitationId) return;
    const result = await cancelInvite.executeAsync({ invitationId: driver.invitationId });
    if (result?.serverError) return toast.error(result.serverError);
    toast("Invitation cancelled");
    onChanged();
  };

  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger
          aria-label={`More options for ${driver.name}`}
          className="state-layer text-on-surface-variant focus-visible:outline-primary data-[state=open]:bg-on-surface/8 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:outline-2"
        >
          <Icon icon={moreVertIcon} size={22} />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={4}
            collisionPadding={8}
            className="bg-surface-container shadow-elevation-2 data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in z-[60] min-w-56 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xs py-2"
          >
            {driver.userId && (
              <Dropdown.Item asChild className={menuItem}>
                <Link href={`/app/fleet/${driver.userId}`}>
                  <Icon icon={personIcon} size={20} className="text-on-surface-variant" />
                  View profile
                </Link>
              </Dropdown.Item>
            )}
            {invited && (
              <Dropdown.Item className={menuItem} onSelect={resend}>
                <Icon icon={forwardToInboxIcon} size={20} className="text-on-surface-variant" />
                {driver.invitationId ? "Resend invitation" : "Resend setup link"}
              </Dropdown.Item>
            )}
            {driver.invitationId && (
              <Dropdown.Item className={menuItem} onSelect={cancel}>
                <Icon icon={cancelIcon} size={20} className="text-on-surface-variant" />
                Cancel invitation
              </Dropdown.Item>
            )}
            {driver.memberId && canRemove && driver.role !== "owner" && (
              <Dropdown.Item className={menuItem} disabled={busy} onSelect={() => setConfirm(true)}>
                <Icon
                  icon={personRemoveIcon}
                  size={20}
                  className={busy ? undefined : "text-on-surface-variant"}
                />
                <span className="flex flex-col">
                  Remove from team
                  {busy && <span className="text-body-sm">Not during an active trip</span>}
                </span>
              </Dropdown.Item>
            )}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      {driver.memberId && (
        <Dialog
          open={confirm}
          onOpenChange={setConfirm}
          title={`Remove ${driver.name}?`}
          description="They lose access to your company's trips right away. Upcoming trips assigned to them go back to unassigned so you can pick another driver."
          actions={
            <>
              <Button variant="text" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={remove.isPending}
                onClick={async () => {
                  const result = await remove.executeAsync({ memberId: driver.memberId! });
                  if (result?.serverError) {
                    toast.error(result.serverError);
                    return;
                  }
                  setConfirm(false);
                  toast(`${driver.name} was removed from the team`);
                  onChanged();
                }}
              >
                Remove
              </Button>
            </>
          }
        />
      )}
    </>
  );
}
