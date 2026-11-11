"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { lockIcon, scienceIcon, warningIcon } from "@/components/ui/icons.generated";
import { publicEnv as env } from "@/lib/public-env";
import { formatUsd } from "@/lib/money";
import { confirmSimulatedPaymentAction } from "@/server/actions/marketplace";

export type PaymentInfo = {
  paymentId: string;
  simulated: boolean;
  clientSecret: string | null;
  totalCents: number;
  feeCents: number;
  carrierCents: number;
  carrierName?: string;
  balanceCents?: number;
};

let stripePromise: Promise<Stripe | null> | null = null;
const getStripeJs = () => {
  if (!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return null;
  stripePromise ??= loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
};

export function PriceBreakdown({ carrierCents, feeCents, totalCents, feeLabel = "AllShip service fee", balanceCents = 0 }: { carrierCents: number; feeCents: number; totalCents: number; feeLabel?: string; balanceCents?: number }) {
  if (balanceCents > 0) {
    return (
      <dl className="flex flex-col gap-2 text-body-lg">
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">Mover&rsquo;s price</dt>
          <dd className="tabular-nums text-on-surface">{formatUsd(carrierCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-on-surface-variant">{feeLabel}</dt>
          <dd className="tabular-nums text-on-surface">{formatUsd(feeCents)}</dd>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-outline-variant pt-3">
          <dt className="text-title-md text-on-surface">Due today to reserve</dt>
          <dd className="text-title-lg tabular-nums text-on-surface">{formatUsd(totalCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-body-md">
          <dt className="text-on-surface-variant">Paid to the mover on delivery</dt>
          <dd className="tabular-nums text-on-surface-variant">{formatUsd(balanceCents)}</dd>
        </div>
      </dl>
    );
  }
  return (
    <dl className="flex flex-col gap-2 text-body-lg">
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">Carrier&rsquo;s bid</dt>
        <dd className="tabular-nums text-on-surface">{formatUsd(carrierCents)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">{feeLabel}</dt>
        <dd className="tabular-nums text-on-surface">{formatUsd(feeCents)}</dd>
      </div>
      <div className="mt-1 flex justify-between gap-4 border-t border-outline-variant pt-3">
        <dt className="text-title-md text-on-surface">Total due now</dt>
        <dd className="text-title-lg tabular-nums text-on-surface">{formatUsd(totalCents)}</dd>
      </div>
    </dl>
  );
}

function readToken(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function useAppearance(): Appearance {
  return useMemo(() => {
    const dark = typeof window !== "undefined" && getComputedStyle(document.documentElement).colorScheme.includes("dark");
    return {
      theme: dark ? "night" : "stripe",
      variables: {
        colorPrimary: readToken("--md-primary", "#005bb3"),
        colorBackground: readToken("--md-surface-container-high", "#ffffff"),
        colorText: readToken("--md-on-surface", "#1a1c20"),
        colorTextSecondary: readToken("--md-on-surface-variant", "#44474e"),
        colorDanger: readToken("--md-error", "#ba1a1a"),
        fontFamily: '"Google Sans", ui-sans-serif, system-ui, sans-serif',
        fontSizeBase: "16px",
        borderRadius: "4px",
        spacingUnit: "4px",
      },
      rules: {
        ".Input": { border: `1px solid ${readToken("--md-outline", "#74777f")}`, boxShadow: "none", padding: "14px 16px" },
        ".Input:focus": { border: `2px solid ${readToken("--md-primary", "#005bb3")}`, boxShadow: "none" },
        ".Label": { fontWeight: "500" },
        ".Tab": { border: `1px solid ${readToken("--md-outline-variant", "#c4c6d0")}`, boxShadow: "none" },
        ".Tab--selected": { borderColor: readToken("--md-primary", "#005bb3"), backgroundColor: readToken("--md-secondary-container", "#d8e2ff") },
      },
    };
  }, []);
}

function StripeForm({ totalCents, returnPath }: { totalCents: number; returnPath: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}${returnPath}` } });
    setSubmitting(false);
    if (err) setError(err.message ?? "Your payment didn't go through. Try another payment method.");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PaymentElement onReady={() => setReady(true)} options={{ layout: { type: "tabs", defaultCollapsed: false } }} />
      {error && (
        <p role="alert" className="flex items-start gap-2 text-body-md text-error">
          <Icon icon={warningIcon} size={20} className="shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={submitting} disabled={!stripe || !ready || submitting} className="w-full">
        Pay {formatUsd(totalCents)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon icon={lockIcon} size={16} />
        Processed by Stripe. AllShip never sees your card number.
      </p>
    </form>
  );
}

export function PaymentStep({ info, publicId, onDone }: { info: PaymentInfo; publicId: string; onDone?: () => void }) {
  const router = useRouter();
  const appearance = useAppearance();
  const { executeAsync, isPending } = useAction(confirmSimulatedPaymentAction);

  if (info.simulated) {
    const confirm = async () => {
      const res = await executeAsync({ paymentId: info.paymentId });
      if (res?.serverError) return void toast.error(res.serverError);
      toast(info.balanceCents ? `Reserved. Pay the mover ${formatUsd(info.balanceCents)} on delivery.` : `Booked. ${formatUsd(info.totalCents)} is held until delivery.`);
      onDone?.();
      router.refresh();
    };
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-md border border-dashed border-tertiary bg-tertiary-container/12 p-4">
          <p className="flex items-center gap-2 text-title-sm text-tertiary">
            <Icon icon={scienceIcon} size={20} />
            Test mode payment
          </p>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Stripe isn&rsquo;t connected in this environment, so no card is charged. Confirming books the carrier exactly as a real payment would.
          </p>
        </div>
        <PriceBreakdown carrierCents={info.carrierCents} feeCents={info.feeCents} totalCents={info.totalCents} balanceCents={info.balanceCents} feeLabel={info.balanceCents ? "AllShip booking fee" : undefined} />
        <Button size="lg" onClick={confirm} loading={isPending} className="w-full">
          Confirm test payment
        </Button>
      </div>
    );
  }

  const stripe = getStripeJs();
  if (!stripe || !info.clientSecret) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-md bg-error-container p-4 text-body-md text-on-error-container">
        <Icon icon={warningIcon} size={20} className="shrink-0" />
        Card payments aren&rsquo;t available right now. Try again in a few minutes or contact support.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PriceBreakdown carrierCents={info.carrierCents} feeCents={info.feeCents} totalCents={info.totalCents} balanceCents={info.balanceCents} feeLabel={info.balanceCents ? "AllShip booking fee" : undefined} />
      <Elements
        stripe={stripe}
        options={{
          clientSecret: info.clientSecret,
          appearance,
          fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&display=swap" }],
        }}
      >
        <StripeForm totalCents={info.totalCents} returnPath={`/app/loads/${publicId}?payment=return`} />
      </Elements>
    </div>
  );
}
