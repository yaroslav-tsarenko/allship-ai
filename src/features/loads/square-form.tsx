"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { lockIcon, warningIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { paySquareAction } from "@/server/actions/marketplace";
import { authClient } from "@/server/auth/client";

export type SquareCheckout = { applicationId: string; locationId: string; environment: "production" | "sandbox" };

type TokenResult = { status: string; token?: string; errors?: Array<{ message?: string }> };
type SquareCard = { attach: (selector: string) => Promise<void>; tokenize: (details: Record<string, unknown>) => Promise<TokenResult>; destroy: () => Promise<boolean> };
type SquarePayments = { card: (options?: Record<string, unknown>) => Promise<SquareCard> };
type SquareGlobal = { payments: (applicationId: string, locationId: string) => SquarePayments };

const scriptUrl = (environment: SquareCheckout["environment"]) => (environment === "sandbox" ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js");
const loading = new Map<string, Promise<SquareGlobal>>();

function loadSquare(environment: SquareCheckout["environment"]) {
  const src = scriptUrl(environment);
  let pending = loading.get(src);
  if (!pending) {
    pending = new Promise<SquareGlobal>((resolve, reject) => {
      const ready = () => {
        const sq = (window as unknown as { Square?: SquareGlobal }).Square;
        if (sq) resolve(sq);
        else reject(new Error("Square failed to load"));
      };
      if ((window as unknown as { Square?: SquareGlobal }).Square) return ready();
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = ready;
      el.onerror = () => {
        loading.delete(src);
        reject(new Error("Square failed to load"));
      };
      document.head.appendChild(el);
    });
    loading.set(src, pending);
  }
  return pending;
}

const readToken = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export function SquareForm({ checkout, paymentId, totalCents, balanceCents, onDone }: { checkout: SquareCheckout; paymentId: string; totalCents: number; balanceCents?: number; onDone?: () => void }) {
  const router = useRouter();
  const containerId = `sq-card-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const cardRef = useRef<SquareCard | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const { data: session } = authClient.useSession();
  const { executeAsync, isPending } = useAction(paySquareAction);

  useEffect(() => {
    let cancelled = false;
    let card: SquareCard | null = null;
    loadSquare(checkout.environment)
      .then(async (sq) => {
        card = await sq.payments(checkout.applicationId, checkout.locationId).card({
          style: {
            input: { fontSize: "16px", color: readToken("--md-on-surface", "#1a1c20") },
            "input::placeholder": { color: readToken("--md-on-surface-variant", "#44474e") },
            ".input-container": { borderColor: readToken("--md-outline", "#74777f"), borderRadius: "4px" },
            ".input-container.is-focus": { borderColor: readToken("--md-primary", "#005bb3") },
          },
        });
        if (cancelled) return void card.destroy();
        await card.attach(`#${containerId}`);
        cardRef.current = card;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      cardRef.current = null;
      void card?.destroy().catch(() => undefined);
    };
  }, [checkout.environment, checkout.applicationId, checkout.locationId, containerId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const card = cardRef.current;
    if (!card) return;
    setError(null);
    setTokenizing(true);
    const [givenName = "", ...rest] = (session?.user.name ?? "").trim().split(/\s+/);
    let result: TokenResult;
    try {
      result = await card.tokenize({
        amount: (totalCents / 100).toFixed(2),
        currencyCode: "USD",
        intent: "CHARGE",
        customerInitiated: true,
        sellerKeyedIn: false,
        billingContact: { givenName, familyName: rest.join(" "), email: session?.user.email, countryCode: "US" },
      });
    } catch {
      result = { status: "ERROR" };
    }
    setTokenizing(false);
    if (result.status !== "OK" || !result.token) {
      if (result.status !== "Invalid") setError(result.errors?.[0]?.message ?? "We couldn't read this card. Check the details and try again.");
      return;
    }
    const res = await executeAsync({ paymentId, sourceId: result.token });
    if (res?.serverError || !res?.data) return void setError(res?.serverError ?? "Your payment didn't go through. Try again.");
    toast(balanceCents ? `Reserved. Pay the mover ${formatUsd(balanceCents)} on delivery.` : `Booked. ${formatUsd(totalCents)} is held until delivery.`);
    onDone?.();
    router.refresh();
  };

  if (loadError) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-md bg-error-container p-4 text-body-md text-on-error-container">
        <Icon icon={warningIcon} size={20} className="shrink-0" />
        The card form didn&rsquo;t load. Turn off content blockers for this page or try again in a minute.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div id={containerId} className="min-h-[90px]" aria-busy={!ready} />
      {error && (
        <p role="alert" className="flex items-start gap-2 text-body-md text-error">
          <Icon icon={warningIcon} size={20} className="shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={tokenizing || isPending} disabled={!ready || tokenizing || isPending} className="w-full">
        Pay {formatUsd(totalCents)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon icon={lockIcon} size={16} />
        Processed by Square. AllShip never sees your card number.
      </p>
    </form>
  );
}
