"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { closeIcon } from "@/components/ui/icons.generated";

export function WelcomeBanner({ count, needsPassword, open }: { count: number; needsPassword: boolean; open: boolean }) {
  const [shown, setShown] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  if (!shown) return null;

  const dismiss = () => {
    setShown(false);
    router.replace(pathname, { scroll: false });
  };

  return (
    <section role="status" aria-labelledby="welcome-title" className="relative rounded-lg bg-primary-container p-5 pr-14 text-on-primary-container medium:p-6 medium:pr-16">
      <IconButton icon={closeIcon} label="Dismiss" onClick={dismiss} className="absolute top-2 right-2 text-on-primary-container" />
      <h2 id="welcome-title" className="text-title-lg">
        {open ? (count > 1 ? `Your ${count} loads are live` : "Your load is live") : "Your email is confirmed"}
      </h2>
      <ol className="mt-3 flex max-w-[64ch] list-decimal flex-col gap-1.5 pl-5 text-body-md">
        <li>Verified carriers see it on the load board and send bids. We email you each new bid.</li>
        <li>Compare prices, delivery dates, ratings and messages, then accept the bid you like.</li>
        <li>Pay into escrow when you accept. The carrier is paid only after you confirm delivery.</li>
      </ol>
      {needsPassword && (
        <div className="mt-5 flex flex-col gap-3 border-t border-on-primary-container/16 pt-4 medium:flex-row medium:items-center medium:justify-between">
          <p className="text-body-md">You signed in with an email link. Add a password to sign in faster next time.</p>
          <Button asChild variant="filled" className="shrink-0 self-start medium:self-auto">
            <Link href="/app/settings/security">Set a password</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
