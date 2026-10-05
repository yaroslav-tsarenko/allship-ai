"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { mailIcon } from "@/components/ui/icons.generated";
import { authClient } from "@/server/auth/client";

export function VerifyEmailPanel({ email }: { email: string | null }) {
  const [sending, setSending] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/app/onboarding" });
    setSending(false);
    if (error) {
      toast.error(error.status === 429 ? "Too many attempts. Wait a few minutes and try again." : (error.message ?? "Could not send the email."));
      return;
    }
    setCoolingDown(true);
    setTimeout(() => setCoolingDown(false), 60_000);
    toast("We sent a new confirmation email.");
  };

  return (
    <div className="flex flex-col gap-4">
      <Icon icon={mailIcon} size={40} className="text-primary" />
      <p className="text-title-lg text-on-surface">Confirm your email to continue</p>
      <p className="text-body-lg text-on-surface-variant">
        {email ? (
          <>
            We sent a confirmation link to <span className="font-medium text-on-surface">{email}</span>. Open it to activate your account. The link expires in 1 hour.
          </>
        ) : (
          "We sent a confirmation link to your email. Open it to activate your account."
        )}
      </p>
      <p className="text-body-md text-on-surface-variant">Nothing in your inbox? Check spam or promotions, or send a new link.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="text" asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
        {email && (
          <Button variant="tonal" onClick={resend} loading={sending} disabled={coolingDown}>
            Send a new link
          </Button>
        )}
      </div>
    </div>
  );
}
