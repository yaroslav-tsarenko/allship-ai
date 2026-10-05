import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { accountBalanceWalletIcon, errorIcon, verifiedUserIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import type { CarrierStanding } from "./eligibility";

type Notice = { key: string; tone: "warning" | "error" | "neutral"; icon: typeof errorIcon; title: string; body: string; href?: string; action?: string };

export function standingNotices(s: CarrierStanding): Notice[] {
  const notices: Notice[] = [];
  if (!s.verified) {
    if (s.fmcsaStatus === "failed") {
      notices.push({ key: "fmcsa", tone: "error", icon: errorIcon, title: "We couldn't verify your company", body: "The USDOT and MC record didn't match what you entered. Check your company details or contact support so we can take another look.", href: "/app/settings", action: "Review company" });
    } else if (s.fmcsaStatus === "unverified") {
      notices.push({ key: "fmcsa", tone: "warning", icon: verifiedUserIcon, title: "Add your USDOT and MC numbers", body: "You can browse loads now. Bidding opens once we've checked your operating authority with FMCSA.", href: "/app/settings", action: "Add details" });
    } else {
      notices.push({ key: "fmcsa", tone: "warning", icon: verifiedUserIcon, title: "Verification in progress", body: "We're checking your USDOT and MC record with FMCSA. Browse loads in the meantime. We'll email you as soon as you can bid." });
    }
  }
  if (s.payoutsRequired && !s.payoutsEnabled) {
    notices.push(
      s.isOwner
        ? { key: "payouts", tone: "neutral", icon: accountBalanceWalletIcon, title: "Set up payouts before you win a load", body: "Shippers can only book carriers who can receive payment. It takes about five minutes with Stripe.", href: "/app/payouts", action: "Set up payouts" }
        : { key: "payouts", tone: "neutral", icon: accountBalanceWalletIcon, title: "Payouts aren't set up yet", body: "Ask your company owner to connect a Stripe account. Shippers can only book carriers who can receive payment." },
    );
  }
  return notices;
}

const tones = {
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container-high text-on-surface",
};

export function StandingBanner({ standing, className }: { standing: CarrierStanding; className?: string }) {
  const notices = standingNotices(standing);
  if (!notices.length) return null;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {notices.map((n) => (
        <section key={n.key} aria-label={n.title} className={cn("flex flex-col gap-3 rounded-md px-4 py-3 medium:flex-row medium:items-center medium:gap-4", tones[n.tone])}>
          <div className="flex min-w-0 flex-1 gap-3">
            <Icon icon={n.icon} size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-title-sm">{n.title}</p>
              <p className="text-body-md opacity-90">{n.body}</p>
            </div>
          </div>
          {n.href && n.action && (
            <Link href={n.href} className="state-layer ml-8 inline-flex h-10 shrink-0 items-center self-start rounded-full px-3 text-label-lg font-medium underline-offset-4 medium:ml-0 medium:self-center">
              {n.action}
            </Link>
          )}
        </section>
      ))}
      {!standing.verified && standing.canBid && (
        <p className="px-1 text-body-sm text-on-surface-variant">Test environment: bidding is allowed before verification.</p>
      )}
    </div>
  );
}
