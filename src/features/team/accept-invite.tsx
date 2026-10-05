"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/server/auth/client";
import { acceptInvitationAction } from "@/server/actions/team";

export function AcceptInvite({ invitationId, companyName }: { invitationId: string; companyName: string }) {
  const router = useRouter();
  const { executeAsync, isPending } = useAction(acceptInvitationAction);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {error}
        </p>
      )}
      <Button
        size="lg"
        loading={isPending || leaving}
        onClick={async () => {
          setError(null);
          const result = await executeAsync({ invitationId });
          if (result?.serverError || !result?.data) {
            setError(result?.serverError ?? "We couldn't accept the invitation. Try again.");
            return;
          }
          setLeaving(true);
          router.replace(result.data.redirectTo);
          router.refresh();
        }}
      >
        Join {companyName}
      </Button>
    </div>
  );
}

export function SwitchAccount({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outlined"
      size="lg"
      loading={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
        router.refresh();
      }}
    >
      Use a different account
    </Button>
  );
}
