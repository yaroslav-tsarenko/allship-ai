"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Viewer = { kind: "guest" } | { kind: "carrier" } | { kind: "shipper" };

export function BidCta({ publicId, open }: { publicId: string; open: boolean }) {
  const [viewer, setViewer] = useState<Viewer>({ kind: "guest" });
  const boardPath = `/app/board/${publicId}`;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/get-session", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { accountType?: string } } | null) => {
        if (cancelled || !data?.user) return;
        setViewer({ kind: data.user.accountType === "carrier" ? "carrier" : "shipper" });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body-lg text-on-surface-variant">Bidding on this load is closed.</p>
        <Button asChild variant="outlined" className="self-start">
          <Link href="/loads">See open loads</Link>
        </Button>
      </div>
    );
  }

  if (viewer.kind === "carrier") {
    return (
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="self-start">
          <Link href={boardPath}>Bid on this load</Link>
        </Button>
        <p className="text-body-md text-on-surface-variant">Opens the full listing in your load board.</p>
      </div>
    );
  }

  if (viewer.kind === "shipper") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body-lg text-on-surface">You can&rsquo;t bid on this load</p>
        <p className="text-body-md text-pretty text-on-surface-variant">You&rsquo;re signed in with a shipper account. Only verified carrier accounts can bid.</p>
        <Button asChild variant="outlined" className="self-start">
          <Link href="/app/loads">Go to my loads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/sign-up?type=carrier">Sign up to bid</Link>
        </Button>
        <Button asChild size="lg" variant="text">
          <Link href={`/sign-in?next=${encodeURIComponent(boardPath)}`}>Sign in</Link>
        </Button>
      </div>
      <p className="text-body-md text-pretty text-on-surface-variant">Carriers need a verified USDOT number to bid. You keep 100% of your bid.</p>
    </div>
  );
}
