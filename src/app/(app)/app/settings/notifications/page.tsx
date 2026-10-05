import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, notificationsIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { EmailPreferences } from "@/features/notifications/email-preferences";
import { emailGroups, emailGroupsFor, emailPreferences } from "@/server/notifications/queries";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Notification settings" };

export default async function NotificationSettingsPage() {
  const viewer = await getViewer();
  const allowed = new Set(emailGroupsFor(viewer.role));
  const groups = emailGroups.filter((g) => allowed.has(g.key)).map(({ key, label, description }) => ({ key, label, description }));
  const prefs = await emailPreferences(viewer.user.id);
  return (
    <div className="mx-auto flex max-w-[840px] flex-col gap-6">
      <div>
        <Link href="/app/settings" className="state-layer -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-lg font-medium text-on-surface-variant">
          <Icon icon={arrowBackIcon} size={20} />
          Settings
        </Link>
        <PageHeader title="Notifications" description={`Choose which updates we email to ${viewer.user.email}.`} />
      </div>
      <Card as="section" aria-labelledby="email-title" className="overflow-hidden">
        <div className="px-6 pt-5 pb-2">
          <h2 id="email-title" className="text-title-lg">
            Email
          </h2>
        </div>
        <EmailPreferences groups={groups} initial={prefs} />
      </Card>
      <Card as="section" variant="filled" className="flex items-start gap-4 bg-surface-container-low p-6">
        <Icon icon={notificationsIcon} className="mt-0.5 shrink-0 text-on-surface-variant" />
        <div>
          <h2 className="text-title-md">In the app</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">You&apos;ll always see updates under the bell at the top of the page, so nothing about a load slips by.</p>
        </div>
      </Card>
    </div>
  );
}
