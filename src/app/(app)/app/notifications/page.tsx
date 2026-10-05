import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { NotificationFeed } from "@/features/notifications/notification-feed";
import { listNotifications, unreadNotificationCount } from "@/server/notifications/queries";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const viewer = await getViewer();
  const { tab } = await searchParams;
  const unreadOnly = tab === "unread";
  const [page, unread] = await Promise.all([listNotifications(viewer.user.id, { unreadOnly }), unreadNotificationCount(viewer.user.id)]);
  return (
    <div className="mx-auto flex max-w-[840px] flex-col">
      <PageHeader title="Notifications" description="Updates about your loads, bids, trips and messages." />
      <LinkTabs
        label="Filter notifications"
        items={[
          { href: "/app/notifications", label: "All", active: !unreadOnly },
          { href: "/app/notifications?tab=unread", label: "Unread", count: unread, active: unreadOnly },
        ]}
      />
      <NotificationFeed key={tab ?? "all"} initial={page.items} nextCursor={page.nextCursor} unreadOnly={unreadOnly} />
    </div>
  );
}
