"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { contentCopyIcon, checkIcon, refreshIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { captureClientError } from "@/lib/sentry-client";

type Surface = "marketing" | "app" | "admin" | "auth";

const copy: Record<Surface, { title: string; body: string; home: { href: string; label: string } }> = {
  marketing: {
    title: "This page didn't load",
    body: "Something broke on our side while building this page. Your quotes and loads are safe. Try again, or head back to the start.",
    home: { href: "/", label: "Go to home" },
  },
  app: {
    title: "This screen hit a problem",
    body: "We couldn't finish loading this part of your dashboard. Nothing you saved was lost, and payments in escrow are not affected.",
    home: { href: "/app", label: "Back to dashboard" },
  },
  admin: {
    title: "The console couldn't load this view",
    body: "The request failed before the data came back. No changes were applied. Retry, or open another section of the console.",
    home: { href: "/admin", label: "Console overview" },
  },
  auth: {
    title: "We couldn't finish signing you in",
    body: "The sign-in step failed on our side. Your account is fine. Try again, or start over from the sign-in page.",
    home: { href: "/sign-in", label: "Back to sign in" },
  },
};

export function ErrorView({
  error,
  retry,
  surface,
  fullScreen = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  surface: Surface;
  fullScreen?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = copy[surface];
  const reference = error.digest;

  useEffect(() => {
    if (!error.digest) captureClientError(error);
  }, [error]);

  const subject = encodeURIComponent(reference ? `Error ${reference}` : "Something went wrong");
  const copyReference = async () => {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      role="alert"
      aria-labelledby="error-title"
      className={cn("mx-auto flex w-full max-w-[640px] flex-col gap-5 px-6", fullScreen ? "min-h-dvh justify-center py-16" : "py-16 medium:py-24")}
    >
      <meta name="robots" content="noindex" />
      <p className="font-mono text-label-lg tracking-wide text-error">500 · unexpected error</p>
      <h1 id="error-title" className="text-headline-lg text-on-surface">
        {text.title}
      </h1>
      <p className="text-body-lg text-on-surface-variant">{text.body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={() => retry()} leading={<Icon icon={refreshIcon} size={18} />}>
          Try again
        </Button>
        <Button variant="outlined" asChild>
          <Link href={text.home.href}>{text.home.label}</Link>
        </Button>
      </div>
      <div className="mt-4 border-t border-outline-variant pt-4 text-body-md text-on-surface-variant">
        <p>
          Still stuck? Email{" "}
          <a href={`mailto:${site.email}?subject=${subject}`} className="text-primary underline underline-offset-2">
            {site.email}
          </a>{" "}
          or call{" "}
          <a href={site.phone.href} className="text-primary underline underline-offset-2">
            {site.phone.display}
          </a>
          {reference ? " and include this reference." : "."}
        </p>
        {reference && (
          <p className="mt-2 flex items-center gap-2">
            <span className="text-label-md uppercase text-on-surface-variant">Reference</span>
            <code className="rounded-xs bg-surface-container-high px-2 py-0.5 font-mono text-body-sm text-on-surface">{reference}</code>
            <button
              type="button"
              onClick={copyReference}
              className="state-layer inline-flex size-8 items-center justify-center rounded-full text-on-surface-variant"
              aria-label={copied ? "Reference copied" : "Copy reference"}
            >
              <Icon icon={copied ? checkIcon : contentCopyIcon} size={18} />
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
