import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon, notificationsIcon, sellIcon, shieldLockIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { PrivacyPanel } from "@/features/settings/privacy-panel";
import { ProfileForm } from "@/features/settings/profile-form";
import { toursFor } from "@/features/tours/ids";
import { TourList } from "@/features/tours/tour-list";
import { deletionBlockers } from "@/server/account/blockers";
import { db } from "@/server/db/client";
import { account } from "@/server/db/schema";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Settings" };

const fmcsaLabel = {
  unverified: { text: "Not verified", cls: "bg-surface-container-highest text-on-surface-variant" },
  pending: { text: "Verification in progress", cls: "bg-warning-container text-on-warning-container" },
  verified: { text: "Verified with FMCSA", cls: "bg-success-container text-on-success-container" },
  failed: { text: "Verification failed", cls: "bg-error-container text-on-error-container" },
  manual_review: { text: "In manual review", cls: "bg-warning-container text-on-warning-container" },
} as const;

export default async function SettingsPage() {
  const viewer = await getViewer();
  const [first = "", ...rest] = viewer.user.name.split(" ");
  const [blockers, [credential]] = await Promise.all([
    deletionBlockers(viewer.user.id),
    db.select({ id: account.id }).from(account).where(and(eq(account.userId, viewer.user.id), eq(account.providerId, "credential"))).limit(1),
  ]);
  return (
    <div className="mx-auto flex max-w-[840px] flex-col gap-6">
      <PageHeader title="Settings" />
      <Card as="section" aria-labelledby="profile-title" className="p-6">
        <h2 id="profile-title" className="mb-5 text-title-lg">
          Profile
        </h2>
        <ProfileForm
          email={viewer.user.email}
          defaults={{ firstName: viewer.user.firstName ?? first, lastName: viewer.user.lastName ?? rest.join(" "), phone: viewer.user.phone ?? "" }}
        />
      </Card>
      {viewer.org && (
        <Card as="section" aria-labelledby="company-title" className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="company-title" className="text-title-lg">
              {viewer.org.orgName}
            </h2>
            {viewer.org.fmcsaStatus && (
              <span className={`rounded-sm px-3 py-1.5 text-label-lg ${fmcsaLabel[viewer.org.fmcsaStatus].cls}`}>{fmcsaLabel[viewer.org.fmcsaStatus].text}</span>
            )}
          </div>
        </Card>
      )}
      <Card as="section" className="overflow-hidden">
        {viewer.org && (viewer.role === "owner" || viewer.role === "dispatcher") && (
          <Link href="/app/settings/pricing" className="state-layer flex items-center gap-4 border-b border-outline-variant px-6 py-5">
            <Icon icon={sellIcon} className="text-on-surface-variant" />
            <span className="flex-1">
              <span className="block text-body-lg">Instant quote rates</span>
              <span className="block text-body-md text-on-surface-variant">Rates per cubic foot, services and areas for instant moving quotes</span>
            </span>
            <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
          </Link>
        )}
        <Link href="/app/settings/notifications" className="state-layer flex items-center gap-4 border-b border-outline-variant px-6 py-5">
          <Icon icon={notificationsIcon} className="text-on-surface-variant" />
          <span className="flex-1">
            <span className="block text-body-lg">Notifications</span>
            <span className="block text-body-md text-on-surface-variant">Choose which updates we email you</span>
          </span>
          <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
        </Link>
        <Link href="/app/settings/security" className="state-layer flex items-center gap-4 px-6 py-5">
          <Icon icon={shieldLockIcon} className="text-on-surface-variant" />
          <span className="flex-1">
            <span className="block text-body-lg">Security</span>
            <span className="block text-body-md text-on-surface-variant">Password, 2-Step Verification, passkeys and signed-in devices</span>
          </span>
          <Icon icon={chevronRightIcon} className="text-on-surface-variant" />
        </Link>
      </Card>
      <Card as="section" id="tours" aria-labelledby="tours-title" className="scroll-mt-24 overflow-hidden">
        <div className="px-6 pt-5 pb-4">
          <h2 id="tours-title" className="text-title-lg">
            Guided tours
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">Short walkthroughs from your AI assistant. Replay any of them whenever you like.</p>
        </div>
        <TourList tourIds={toursFor(viewer.role)} />
      </Card>
      <Card as="section" id="privacy" aria-labelledby="privacy-title" className="scroll-mt-24 p-6">
        <h2 id="privacy-title" className="mb-5 text-title-lg">
          Your data
        </h2>
        <PrivacyPanel blockers={blockers} hasPassword={Boolean(credential)} />
      </Card>
    </div>
  );
}
