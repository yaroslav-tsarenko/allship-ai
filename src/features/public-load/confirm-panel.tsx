"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { site } from "@/content/site";
import { resendPublishLink } from "@/server/actions/funnel";
import { emailSchema } from "./model";
import { InboxScreen } from "./inbox-screen";

function ExpiredLink() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { executeAsync, isPending, result } = useAction(resendPublishLink);

  if (sentTo) return <InboxScreen email={sentTo} headingLevel="h1" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md font-normal text-on-surface">This link has expired or was already used</h1>
        <p className="mt-3 max-w-[56ch] text-body-lg text-pretty text-on-surface-variant">
          Confirmation links work once and expire after 72 hours. Your load is still saved. Enter the email you used and we&rsquo;ll send a new link.
        </p>
      </div>
      <form
        noValidate
        className="flex max-w-[480px] flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const parsed = emailSchema.safeParse(email);
          if (!parsed.success) return setError("Enter a valid email address");
          setError(null);
          const res = await executeAsync({ email: parsed.data });
          if (res?.data?.ok) setSentTo(parsed.data);
        }}
      >
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? result.serverError} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={isPending}>
            Send a new link
          </Button>
          <Button asChild variant="text">
            <Link href="/sign-in?next=/app/loads">I already confirmed. Sign in</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ConfirmPanel() {
  const params = useSearchParams();
  const error = params.get("error");
  const email = params.get("email");

  if (error === "carrier_account") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-md font-normal text-on-surface">Carrier accounts can&rsquo;t post loads</h1>
        <p className="max-w-[56ch] text-body-lg text-pretty text-on-surface-variant">
          You&rsquo;re signed in with a carrier or driver account. To ship something yourself, sign out and post the load with a different email. To haul loads, open the load board.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/app/board">Open the load board</Link>
          </Button>
          <Button asChild variant="outlined">
            <Link href="/app/settings">Account settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error === "claim_failed") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-headline-md font-normal text-on-surface">We couldn&rsquo;t publish your load</h1>
        <p className="max-w-[56ch] text-body-lg text-pretty text-on-surface-variant">
          Your email is confirmed and your load is saved. Something went wrong while publishing it. Try again, or call us at{" "}
          <a href={site.phone.href} className="text-primary underline-offset-2 hover:underline">
            {site.phone.display}
          </a>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <form action="/load/claim" method="get">
            <Button type="submit">Try again</Button>
          </form>
          <Button asChild variant="outlined">
            <Link href="/app/loads">Go to my loads</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) return <ExpiredLink />;
  if (email) return <InboxScreen email={email} headingLevel="h1" initialCooldown={0} />;
  return <ExpiredLink />;
}
