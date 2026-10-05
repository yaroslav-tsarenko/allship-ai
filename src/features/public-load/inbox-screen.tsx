"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { mailIcon, openInNewIcon } from "@/components/ui/icons.generated";
import { resendPublishLink } from "@/server/actions/funnel";

const COOLDOWN = 60;

type Provider = "gmail" | "outlook" | "yahoo";

function providerFor(email: string): Provider | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (["gmail.com", "googlemail.com"].includes(domain)) return "gmail";
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return "outlook";
  if (/^(yahoo|ymail)\./.test(domain)) return "yahoo";
  return null;
}

const inboxes = {
  gmail: { label: "Open Gmail", href: "https://mail.google.com/mail/u/0/#search/from%3Aallship.ai+in%3Aanywhere+newer_than%3A1d" },
  outlook: { label: "Open Outlook", href: "https://outlook.live.com/mail/0/" },
  yahoo: { label: "Open Yahoo Mail", href: "https://mail.yahoo.com/" },
} as const;

export function InboxScreen({ email, publicId, onEditEmail, initialCooldown = COOLDOWN, headingLevel = "h2" }: { email: string; publicId?: string; onEditEmail?: () => void; initialCooldown?: number; headingLevel?: "h1" | "h2" }) {
  const [left, setLeft] = useState(initialCooldown);
  const [sent, setSent] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { executeAsync, isPending, result } = useAction(resendPublishLink);
  const provider = providerFor(email);
  const order: Provider[] = provider ? [provider, ...(["gmail", "outlook"] as const).filter((p) => p !== provider)] : ["gmail", "outlook"];
  const Heading = headingLevel;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  const resend = async () => {
    const res = await executeAsync({ email });
    if (res?.data?.ok) {
      setSent(true);
      setLeft(COOLDOWN);
    }
  };

  return (
    <section aria-labelledby="inbox-heading" className="flex flex-col gap-6">
      <span className="flex size-14 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
        <Icon icon={mailIcon} size={28} />
      </span>
      <div>
        <Heading id="inbox-heading" ref={headingRef} tabIndex={-1} className="text-headline-md font-normal text-on-surface outline-none">
          Check your inbox
        </Heading>
        <p className="mt-3 max-w-[56ch] text-body-lg text-pretty text-on-surface-variant">
          We sent a link to <span className="font-medium text-on-surface">{email}</span>.{" "}
          {publicId ? (
            <>
              Click it to confirm your email and publish <span className="font-mono text-on-surface">{publicId}</span> to verified carriers.
            </>
          ) : (
            "Click it to confirm your email and publish your load to verified carriers."
          )}
        </p>
      </div>
      <ol className="flex max-w-[56ch] flex-col gap-3 border-l-2 border-outline-variant pl-5 text-body-md text-on-surface-variant">
        <li>Your load is saved as a draft. Nobody sees it until you confirm.</li>
        <li>After you confirm, carriers bid. You compare their prices, ratings and messages.</li>
        <li>You pay only after you accept a bid, and the money waits in escrow until delivery.</li>
      </ol>
      <div className="flex flex-wrap gap-3">
        {order.map((p) => (
          <Button key={p} asChild variant={p === order[0] ? "filled" : "outlined"}>
            <a href={inboxes[p].href} target="_blank" rel="noopener noreferrer">
              {inboxes[p].label}
              <Icon icon={openInNewIcon} size={18} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-outline-variant pt-5">
        <p className="text-body-md text-on-surface-variant">No email after a couple of minutes? Check spam and promotions. The link works for 72 hours.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="tonal" onClick={resend} loading={isPending} disabled={left > 0 || isPending}>
            {left > 0 ? `Resend in ${left}s` : "Resend the link"}
          </Button>
          {onEditEmail && (
            <Button variant="text" onClick={onEditEmail}>
              Use a different email
            </Button>
          )}
        </div>
        <p aria-live="polite" className="text-body-sm text-on-surface-variant">
          {result.serverError ? <span className="text-error">{result.serverError}</span> : sent ? "We sent a new link. Earlier links still work until they expire." : ""}
        </p>
      </div>
    </section>
  );
}
