"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { withdrawDisputeAction } from "@/server/actions/trips";

export function WithdrawDisputeButton({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { executeAsync, isPending } = useAction(withdrawDisputeAction);

  const withdraw = async () => {
    const res = await executeAsync({ disputeId });
    if (res?.serverError) return void toast.error(res.serverError);
    toast("Dispute withdrawn. The load is back where it was.");
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Withdraw dispute
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Withdraw this dispute?"
        description="The load goes back to its previous status and the normal payment rules apply again. You can still report a new problem later if the load isn't complete."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Keep it open
            </Button>
            <Button onClick={withdraw} loading={isPending}>
              Withdraw
            </Button>
          </>
        }
      />
    </>
  );
}
