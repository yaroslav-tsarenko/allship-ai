import type { ReactNode } from "react";
import { RouteFade } from "@/components/motion/route-fade";
import { Logo } from "@/components/ui/logo";
import { AssistantButton, AssistantDock, AssistantProvider } from "@/features/assistant/assistant-root";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { chatActorFromViewer, unreadConversationCount } from "@/server/chat/service";
import { unreadNotificationCount } from "@/server/notifications/queries";
import type { Viewer } from "@/server/viewer/viewer";
import { AccountMenu } from "./account-menu";
import { LiveCountsProvider } from "./live-counts";
import { navItemsFor, roleLabels } from "./nav-items";
import { NavigationBar, NavigationDrawer, NavigationRail } from "./navigation";

export async function AppShell({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  const items = navItemsFor(viewer.role, viewer.isAdmin);
  const [notifications, conversations] = await Promise.all([
    unreadNotificationCount(viewer.user.id).catch(() => 0),
    unreadConversationCount(chatActorFromViewer(viewer)).catch(() => 0),
  ]);
  return (
    <LiveCountsProvider userId={viewer.user.id} initial={{ notifications, conversations }}>
      <AssistantProvider role={viewer.role} firstName={viewer.user.name.split(" ")[0] || "there"}>
        <div className="bg-surface min-h-dvh">
          <a
            href="#main"
            className="bg-primary text-on-primary sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            Skip to content
          </a>
          <header className="m3-elevate-on-scroll bg-surface large:px-6 sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-transparent px-4">
            <Logo href="/app" height={24} />
            <div className="flex-1" />
            <AssistantButton />
            <NotificationBell />
            <AccountMenu
              name={viewer.user.name}
              email={viewer.user.email}
              image={viewer.user.image}
              roleLabel={viewer.isAdmin ? "AllShip staff" : roleLabels[viewer.role]}
              orgName={viewer.org?.orgName}
            />
          </header>
          <div className="flex">
            <NavigationRail items={items} />
            <NavigationDrawer items={items} />
            <main
              id="main"
              className="medium:pr-6 medium:pb-10 medium:pl-0 large:pl-0 min-w-0 flex-1 px-4 pb-28"
            >
              <RouteFade>{children}</RouteFade>
            </main>
            <AssistantDock />
          </div>
          <NavigationBar items={items} />
        </div>
      </AssistantProvider>
    </LiveCountsProvider>
  );
}
