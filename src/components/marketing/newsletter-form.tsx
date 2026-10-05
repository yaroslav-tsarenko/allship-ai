"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { subscribeNewsletter } from "@/server/marketing/newsletter";

export function NewsletterForm({ initialEmail = "", autoFocus = false, doneIcon }: { initialEmail?: string; autoFocus?: boolean; doneIcon: ReactNode }) {
  const [email, setEmail] = useState(initialEmail);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!autoFocus) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus]);
  const { executeAsync, isPending, result } = useAction(subscribeNewsletter);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await executeAsync({ email, audience: "shipper" });
    if (res?.data?.ok) {
      setDone(true);
      track("newsletter_signup");
    }
  };

  if (done)
    return (
      <p className="flex max-w-[400px] animate-enter items-start gap-3 text-body-md text-on-surface" role="status">
        <span className="flex size-6 shrink-0 animate-pop-in items-center justify-center rounded-full bg-primary text-on-primary [animation-delay:120ms]">
          {doneIcon}
        </span>
        Check your inbox to confirm your subscription.
      </p>
    );

  return (
    <form onSubmit={submit} className="flex max-w-[400px] flex-col gap-2">
      <label htmlFor="newsletter-email" className="text-title-sm text-on-surface">
        Shipping guides, twice a month
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-10 min-w-0 flex-1 rounded-full border border-outline bg-surface px-4 text-body-md text-on-surface outline-none transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard hover:border-on-surface focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--md-primary)]"
        />
        <Button type="submit" variant="tonal" loading={isPending}>
          Subscribe
        </Button>
      </div>
      {result.serverError && <p className="animate-message-in text-body-sm text-error">{result.serverError}</p>}
      {result.validationErrors && <p className="animate-message-in text-body-sm text-error">Enter a valid email address.</p>}
    </form>
  );
}
