"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setEnrollmentAction } from "./actions";

export function EnrollmentActions({ id, status, email }: { id: string; status: string; email: string }) {
  const router = useRouter();
  const { executeAsync, isPending } = useAction(setEnrollmentAction);
  if (status === "unsubscribed") return <span className="text-body-sm text-on-surface-variant">Opted out</span>;
  const op = status === "active" ? "stop" : "resume";
  const run = async () => {
    const result = await executeAsync({ id, op });
    if (result?.serverError) return toast.error(result.serverError);
    toast(op === "stop" ? "Sequence stopped" : "Sequence resumed. The next step goes out on the next cron run.");
    router.refresh();
  };
  return (
    <Button size="sm" variant={op === "stop" ? "text" : "outlined"} loading={isPending} onClick={run} aria-label={`${op === "stop" ? "Stop" : "Resume"} emails to ${email}`}>
      {op === "stop" ? "Stop" : "Resume"}
    </Button>
  );
}
