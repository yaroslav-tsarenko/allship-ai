import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon, chevronRightIcon, shieldLockIcon, verifiedUserIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { CarrierHomeSummary } from "@/features/board/home-summary";
import { HomeTrips } from "@/features/trips/home-trips";
import { ShipperSummary } from "@/features/loads/shipper-summary";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Home" };

type Step = { label: string; detail: string; done: boolean; href: string };

export default async function AppHome() {
  const viewer = await getViewer();
  if (viewer.needsOnboarding) redirect("/app/onboarding");

  const firstName = viewer.user.firstName ?? viewer.user.name.split(" ")[0];
  const security: Step = {
    label: "Turn on 2-Step Verification",
    detail: "Protect payments and payouts with an authenticator app or a passkey.",
    done: Boolean(viewer.user.twoFactorEnabled),
    href: "/app/settings/security",
  };

  const steps: Step[] =
    viewer.role === "shipper"
      ? [
          { label: "Create your account", detail: "Email confirmed and profile saved.", done: true, href: "/app/settings" },
          security,
        ]
      : viewer.role === "driver"
        ? [security]
        : [
            { label: "Add your company", detail: `${viewer.org?.orgName ?? "Company"} is set up.`, done: Boolean(viewer.org), href: "/app/settings" },
            {
              label: "Verify USDOT and MC numbers",
              detail: viewer.org?.fmcsaStatus === "verified" ? "Authority verified with FMCSA." : "We check your operating authority with FMCSA before you can bid.",
              done: viewer.org?.fmcsaStatus === "verified",
              href: "/app/settings",
            },
            {
              label: "Connect payouts",
              detail: viewer.org?.payoutsEnabled ? "Stripe payouts are active." : "Payouts go to a Stripe account in your company's name.",
              done: Boolean(viewer.org?.payoutsEnabled),
              href: "/app/settings",
            },
            security,
          ];

  const remaining = steps.filter((s) => !s.done).length;

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={remaining === 0 ? "Your account is ready." : `${remaining} ${remaining === 1 ? "step" : "steps"} left to finish setting up your account.`}
      />
      {viewer.role === "shipper" && viewer.user.accountType === "shipper" && <ShipperSummary userId={viewer.user.id} />}
      <CarrierHomeSummary viewer={viewer} />
      <HomeTrips viewer={viewer} />
      <Card as="section" data-tour="home-setup" aria-labelledby="setup-title" className="overflow-hidden">
        <h2 id="setup-title" className="px-6 pt-5 pb-2 text-title-lg">
          Account setup
        </h2>
        <ol>
          {steps.map((step) => (
            <li key={step.label} className="border-t border-outline-variant first:border-t-0">
              <Link href={step.href} className="state-layer flex items-center gap-4 px-6 py-4">
                <Icon
                  icon={step.done ? checkCircleIcon : step.label.includes("2-Step") ? shieldLockIcon : verifiedUserIcon}
                  filled={step.done}
                  className={step.done ? "text-success" : "text-on-surface-variant"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-body-lg text-on-surface">{step.label}</span>
                  <span className="block text-body-md text-on-surface-variant">{step.detail}</span>
                </span>
                <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
              </Link>
            </li>
          ))}
        </ol>
      </Card>
      {viewer.isAdmin && (
        <div className="mt-6">
          <Button variant="tonal" asChild>
            <Link href="/admin">Open admin console</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
