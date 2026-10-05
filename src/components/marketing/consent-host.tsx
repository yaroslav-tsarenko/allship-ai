"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { CONSENT_STORAGE_KEY } from "./tag-manager";

const CONSENT_OPEN_EVENT = "allship:open-consent";

const loadDialog = () => import("./consent-dialog");
const ConsentDialog = dynamic(() => loadDialog().then((m) => m.ConsentDialog), { ssr: false });

type Choice = { analytics: boolean; ads: boolean; at: string };

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Choice) : null;
  } catch {
    return null;
  }
}

function applyChoice(choice: Pick<Choice, "analytics" | "ads">) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.ads ? "granted" : "denied",
    ad_user_data: choice.ads ? "granted" : "denied",
    ad_personalization: choice.ads ? "granted" : "denied",
  });
}

const regionClass = "fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[720px] rounded-lg bg-surface-container-high p-5 shadow-elevation-3 medium:inset-x-6 medium:bottom-6";

export function ConsentHost({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [manage, setManage] = useState(false);
  const [dialogMounted, setDialogMounted] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(true);

  useEffect(() => {
    const saved = readChoice();
    const t = window.setTimeout(() => setVisible(!saved), 0);
    const open = () => {
      const current = readChoice();
      setAnalytics(current?.analytics ?? true);
      setAds(current?.ads ?? true);
      setDialogMounted(true);
      setManage(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(CONSENT_OPEN_EVENT, open);
    };
  }, []);

  const save = (choice: Pick<Choice, "analytics" | "ads">) => {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    const final = { analytics: choice.analytics, ads: choice.ads && !gpc };
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...final, at: new Date().toISOString() }));
    } catch {}
    applyChoice(final);
    if (visible && !manage) setLeaving(true);
    else setVisible(false);
    setManage(false);
  };

  const onBannerClick = (e: MouseEvent) => {
    const action = (e.target as Element).closest("[data-consent]")?.getAttribute("data-consent");
    if (action === "manage") {
      setDialogMounted(true);
      setManage(true);
    } else if (action === "reject") save({ analytics: false, ads: false });
    else if (action === "accept") save({ analytics: true, ads: true });
  };

  return (
    <>
      {visible && !manage && (
        <div
          role="region"
          aria-label="Cookie preferences"
          onClick={onBannerClick}
          onPointerEnter={() => void loadDialog()}
          onAnimationEnd={(e) => {
            if (leaving && e.target === e.currentTarget) {
              setLeaving(false);
              setVisible(false);
            }
          }}
          className={leaving ? `${regionClass} pointer-events-none animate-banner-out` : `${regionClass} animate-banner-in [animation-delay:400ms]`}
        >
          {children}
        </div>
      )}
      {dialogMounted && (
        <ConsentDialog
          open={manage}
          onOpenChange={setManage}
          analytics={analytics}
          ads={ads}
          onAnalyticsChange={setAnalytics}
          onAdsChange={setAds}
          onSave={() => save({ analytics, ads })}
        />
      )}
    </>
  );
}

export function ConsentSettingsLink() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className="inline-flex min-h-6 cursor-pointer items-center text-on-surface-variant hover:text-on-surface hover:underline">
      Cookie settings
    </button>
  );
}
