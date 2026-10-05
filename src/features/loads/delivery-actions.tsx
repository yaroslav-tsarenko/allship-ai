"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { taskAltIcon } from "@/components/ui/icons.generated";
import { DisputeDialog } from "@/features/disputes/dispute-dialog";
import { confirmCompletionAction } from "@/server/actions/trips";

function remaining(deadline: number, now: number) {
  const ms = deadline - now;
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)} d ${hours % 24} h`;
  if (hours >= 1) return `${hours} h ${minutes} min`;
  return `${Math.max(1, minutes)} min`;
}

export function AutoReleaseCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const left = remaining(new Date(deadline).getTime(), now);
  return <span className="tabular-nums">{left ? `in ${left}` : "any minute now"}</span>;
}

export function ConfirmDeliveryActions({ loadId, carrierName, amountLabel }: { loadId: string; carrierName: string; amountLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, isPending } = useAction(confirmCompletionAction);

  const confirm = async () => {
    const res = await executeAsync({ loadId });
    if (res?.serverError) return void toast.error(res.serverError);
    toast.success(`Delivery confirmed. ${amountLabel} is on its way to ${carrierName}.`);
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-2 medium:flex-row">
      <Button size="lg" onClick={() => setOpen(true)} leading={<Icon icon={taskAltIcon} size={22} />}>
        Confirm delivery
      </Button>
      <DisputeDialog loadId={loadId} role="shipper" triggerVariant="outlined" triggerClassName="h-14 self-start rounded-[28px] px-6 medium:self-auto" />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm delivery?"
        description={`We'll release ${amountLabel} from escrow to ${carrierName}. After that you can't open a dispute for this load.`}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Not yet
            </Button>
            <Button onClick={confirm} loading={isPending}>
              Confirm and release payment
            </Button>
          </>
        }
      />
    </div>
  );
}
