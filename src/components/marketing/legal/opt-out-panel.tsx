"use client";

import { useEffect, useState } from "react";
import { CONSENT_STORAGE_KEY } from "@/components/marketing/tag-manager";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon, infoIcon } from "@/components/ui/icons.generated";

type Status = "loading" | "gpc" | "opted-out" | "not-opted-out";

function readStatus(): Status {
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  if (gpc) return "gpc";
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as { ads?: boolean }) : null;
    return saved && saved.ads === false ? "opted-out" : "not-opted-out";
  } catch {
    return "not-opted-out";
  }
}

export function OptOutPanel() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const t = window.setTimeout(() => setStatus(readStatus()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const optOut = () => {
    let analytics = false;
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      analytics = raw ? Boolean((JSON.parse(raw) as { analytics?: boolean }).analytics) : false;
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics, ads: false, at: new Date().toISOString() }));
    } catch {}
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    setStatus("opted-out");
  };

  const done = status === "gpc" || status === "opted-out";

  return (
    <div className="rounded-lg bg-surface-container-low p-6 medium:p-8">
      <h2 className="text-title-lg text-on-surface">Opt out on this browser</h2>
      <div aria-live="polite" className="mt-3 min-h-12">
        {status === "loading" && <p className="text-body-lg text-on-surface-variant">Checking this browser…</p>}
        {status === "gpc" && (
          <p className="flex gap-3 text-body-lg text-on-surface">
            <Icon icon={checkCircleIcon} className="mt-0.5 shrink-0 text-success" />
            Your browser is sending a Global Privacy Control signal. You are opted out on this browser, and advertising cookies stay off.
          </p>
        )}
        {status === "opted-out" && (
          <p className="flex gap-3 text-body-lg text-on-surface">
            <Icon icon={checkCircleIcon} className="mt-0.5 shrink-0 text-success" />
            You are opted out on this browser. Advertising cookies are off.
          </p>
        )}
        {status === "not-opted-out" && (
          <p className="flex gap-3 text-body-lg text-on-surface-variant">
            <Icon icon={infoIcon} className="mt-0.5 shrink-0" />
            Advertising cookies may be on in this browser. Opting out turns them off and tells Google tags to stop using your data for ads.
          </p>
        )}
      </div>
      {!done && status !== "loading" && (
        <Button size="lg" className="mt-5" onClick={optOut}>
          Opt out of sale and sharing
        </Button>
      )}
      <p className="mt-5 text-body-md text-on-surface-variant">This choice is saved in this browser only. Repeat it on other browsers and devices, or email us to opt out across your account.</p>
    </div>
  );
}
