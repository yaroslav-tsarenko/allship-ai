"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { locationOffIcon, myLocationIcon, shareLocationIcon } from "@/components/ui/icons.generated";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { recordLocationAction } from "@/server/actions/trips";

const SEND_EVERY_MS = 20_000;
const FRESH_MS = 120_000;

type Phase = "off" | "locating" | "on" | "denied" | "unsupported" | "error";
type Fix = { lat: number; lng: number; accuracy: number; heading: number | null; speed: number | null; at: number };

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });

function storageKey(loadId: string) {
  return `allship:share:${loadId}`;
}

function readConsent(loadId: string) {
  try {
    return window.sessionStorage.getItem(storageKey(loadId)) === "1";
  } catch {
    return false;
  }
}

function writeConsent(loadId: string, on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(storageKey(loadId), "1");
    else window.sessionStorage.removeItem(storageKey(loadId));
  } catch {}
}

export function LocationShare({ loadId }: { loadId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("off");
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [wakeLocked, setWakeLocked] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef<Fix | null>(null);
  const sentAt = useRef(0);
  const inFlight = useRef(false);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const sharing = phase === "on" || phase === "locating";

  const releaseWakeLock = useCallback(() => {
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
    setWakeLocked(false);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator) || wakeLock.current) return;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      wakeLock.current = sentinel;
      setWakeLocked(true);
      sentinel.addEventListener("release", () => {
        if (wakeLock.current === sentinel) {
          wakeLock.current = null;
          setWakeLocked(false);
        }
      });
    } catch {
      setWakeLocked(false);
    }
  }, []);

  const stop = useCallback(
    (next: Phase = "off") => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      releaseWakeLock();
      setPhase(next);
    },
    [releaseWakeLock],
  );

  const send = useCallback(async () => {
    const fix = latest.current;
    if (!fix || inFlight.current) return;
    if (Date.now() - sentAt.current < SEND_EVERY_MS || Date.now() - fix.at > FRESH_MS) return;
    inFlight.current = true;
    try {
      const result = await recordLocationAction({
        loadId,
        lat: fix.lat,
        lng: fix.lng,
        accuracyM: Math.min(fix.accuracy, 100_000),
        headingDeg: fix.heading,
        speedMph: fix.speed,
      });
      if (result?.serverError) {
        setProblem(result.serverError);
        return;
      }
      const data = result?.data;
      if (data?.stored || (data && "reason" in data && data.reason === "throttled")) {
        sentAt.current = Date.now();
        if (data.stored) setLastSent(Date.now());
        setProblem(null);
      } else if (data && "reason" in data && data.reason === "not_tracking") {
        writeConsent(loadId, false);
        stop();
        router.refresh();
      } else if (data && "reason" in data && data.reason === "rate_limited") {
        sentAt.current = Date.now() + 60_000;
        setProblem("Location updates are paused for a minute.");
      }
    } catch {
      setProblem("No connection. We'll retry automatically.");
    } finally {
      inFlight.current = false;
    }
  }, [loadId, router, stop]);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setPhase("unsupported");
      return;
    }
    setProblem(null);
    setPhase("locating");
    sentAt.current = 0;
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, heading, speed } = position.coords;
        latest.current = {
          lat: latitude,
          lng: longitude,
          accuracy: acc,
          heading: heading === null || Number.isNaN(heading) ? null : Math.min(Math.max(heading, 0), 360),
          speed: speed === null || Number.isNaN(speed) ? null : Math.min(Math.max(speed * 2.23694, 0), 200),
          at: position.timestamp || Date.now(),
        };
        setAccuracy(acc);
        setPhase("on");
        void send();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          writeConsent(loadId, false);
          stop("denied");
        } else if (error.code === error.TIMEOUT) {
          setProblem("Still looking for a GPS signal…");
        } else {
          setProblem("Can't get your location right now. Check that location services are on.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    timer.current = setInterval(() => void send(), 5_000);
    void requestWakeLock();
  }, [loadId, requestWakeLock, send, stop]);

  useEffect(() => {
    if (readConsent(loadId)) {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
  }, [loadId, start]);

  useEffect(() => {
    if (!sharing) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
        void send();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestWakeLock, send, sharing]);

  useEffect(() => () => stop(), [stop]);

  const toggle = (on: boolean) => {
    writeConsent(loadId, on);
    if (on) start();
    else stop();
  };

  const status =
    phase === "on"
      ? lastSent
        ? `Last sent ${timeFmt.format(lastSent)}${accuracy ? ` · accurate to ${accuracy < 1000 ? `${Math.round(accuracy)} m` : `${(accuracy / 1000).toFixed(1)} km`}` : ""}`
        : "Location found. Sending first update…"
      : phase === "locating"
        ? "Finding your location…"
        : phase === "denied"
          ? null
          : phase === "unsupported"
            ? "This browser can't share location. Try Chrome or Safari on your phone."
            : "Off. The shipper won't see where you are.";

  return (
    <section data-tour="trip-location" aria-labelledby="share-title" className={cn("rounded-lg border p-4 medium:p-5", sharing ? "border-primary bg-primary-container/35" : "border-outline-variant bg-surface-container-low")}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full", sharing ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant")}>
          <Icon icon={phase === "denied" ? locationOffIcon : sharing ? myLocationIcon : shareLocationIcon} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <Switch
            id="share-location"
            checked={sharing}
            onCheckedChange={toggle}
            disabled={phase === "unsupported"}
            label={<span id="share-title">Share live location</span>}
            description={
              <span aria-live="polite">
                {status}
                {sharing && wakeLocked ? " · Screen stays on" : ""}
              </span>
            }
          />
          {sharing && (
            <p className="mt-2 text-body-sm text-on-surface-variant">Keep this page open while you drive. Updates go out about every 20 seconds and stop when you confirm delivery.</p>
          )}
          {problem && sharing && (
            <p className="mt-2 text-body-sm text-on-surface" role="status">
              {problem}
            </p>
          )}
          {phase === "denied" && (
            <div role="alert" className="mt-3 rounded-md bg-error-container px-3 py-2.5 text-body-md text-on-error-container">
              <p className="font-medium">Location access is blocked</p>
              <p className="mt-0.5">
                Allow location for this site in your browser settings (on iPhone: Settings → Safari → Location; on Android: tap the lock icon next to the address), then turn sharing on again.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
