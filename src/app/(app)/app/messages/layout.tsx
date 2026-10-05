import type { ReactNode } from "react";
import { MessagesLayout } from "@/features/chat/messages-layout";
import { chatActorFromViewer, listConversations } from "@/server/chat/service";
import { getViewer } from "@/server/viewer/viewer";

export default async function Layout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const conversations = await listConversations(chatActorFromViewer(viewer));
  return (
    <MessagesLayout initial={conversations} viewerId={viewer.user.id}>
      {children}
    </MessagesLayout>
  );
}
