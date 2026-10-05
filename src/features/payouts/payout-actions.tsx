"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { openInNewIcon, refreshIcon } from "@/components/ui/icons.generated";
import { openPayoutDashboardAction, refreshPayoutStatusAction, startPayoutOnboardingAction } from "@/server/actions/marketplace";
import type { PayoutSetup } from "./queries";

export function PayoutActions({ setup, landing }: { setup: PayoutSetup; landing: "return" | "refresh" | null }) {
  const router = useRouter();
  const start = useAction(startPayoutOnboardingAction);
  const dashboard = useAction(openPayoutDashboardAction);
  const refresh = useAction(refreshPayoutStatusAction);
  const [leaving, setLeaving] = useState(false);
  const handled = useRef(false);

  const go = async (run: typeof start.executeAsync) => {
    const result = await run();
    if (result?.serverError || !result?.data?.url) {
      toast.error(result?.serverError ?? "Stripe didn't respond. Try again in a moment.");
      return;
    }
    setLeaving(true);
    window.location.assign(result.data.url);
  };

  const onRefresh = async (quiet = false) => {
    const result = await refresh.executeAsync();
    if (result?.serverError) return toast.error(result.serverError);
    if (!quiet) toast("Status updated");
    router.refresh();
  };

  useEffect(() => {
    if (!landing || handled.current) return;
    handled.current = true;
    router.replace("/app/payouts", { scroll: false });
    if (landing === "return") {
      void onRefresh(true);
    } else {
      toast("That setup link expired. Opening a fresh one…");
      void start.executeAsync().then((result) => {
        if (result?.data?.url) window.location.assign(result.data.url);
        else toast.error(result?.serverError ?? "Stripe didn't respond. Try again in a moment.");
      });
    }
  });

  return (
    <div className="flex flex-wrap gap-2">
      {setup !== "enabled" && (
        <Button size="lg" loading={start.isPending || (leaving && !dashboard.isPending)} onClick={() => go(start.executeAsync)}>
          {setup === "pending" ? "Continue setup" : "Set up payouts"}
        </Button>
      )}
      {setup !== "not_started" && (
        <Button variant={setup === "enabled" ? "filled" : "outlined"} size="lg" loading={dashboard.isPending} trailing={<Icon icon={openInNewIcon} size={18} />} onClick={() => go(dashboard.executeAsync)}>
          Open Stripe dashboard
        </Button>
      )}
      {setup !== "not_started" && (
        <Button variant="text" size="lg" loading={refresh.isPending} leading={<Icon icon={refreshIcon} size={18} />} onClick={() => onRefresh()}>
          Refresh status
        </Button>
      )}
    </div>
  );
}
