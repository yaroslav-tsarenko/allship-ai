"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ConversationSummary } from "@/server/chat/service";
import { ConversationList } from "./conversation-list";

export function MessagesLayout({ initial, viewerId, children }: { initial: ConversationSummary[]; viewerId: string; children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const activeId = segment && segment !== "__PAGE__" ? segment : null;
  const threadOpen = Boolean(activeId);
  return (
    <div
      className={cn(
        "flex expanded:mx-0 expanded:mb-0 expanded:h-[calc(100dvh-6.5rem)] expanded:gap-3 expanded:pt-2",
        threadOpen && "-mx-4 -mb-28 h-[calc(100dvh-4rem)] medium:mx-0 medium:mb-0 medium:h-[calc(100dvh-6.5rem)] medium:pt-2",
      )}
    >
      <aside aria-label="Conversations" className={cn("min-w-0 flex-col expanded:flex expanded:w-[340px] expanded:shrink-0 large:w-[380px]", threadOpen ? "hidden" : "flex w-full")}>
        <div className="flex items-center justify-between pt-2 pb-4 medium:pt-4 expanded:px-4 expanded:pt-2 expanded:pb-3">
          <h1 className="text-headline-md text-on-surface medium:text-headline-lg expanded:text-headline-sm">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 expanded:overflow-y-auto expanded:overscroll-contain">
          <ConversationList initial={initial} viewerId={viewerId} activeId={activeId} />
        </div>
      </aside>
      <section className={cn("min-w-0 flex-1 flex-col overflow-hidden bg-surface medium:rounded-xl medium:bg-surface-container-low", threadOpen ? "flex" : "hidden expanded:flex")}>{children}</section>
    </div>
  );
}
