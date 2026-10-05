import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon } from "@/components/ui/icons.generated";
import { avatarTone, initials } from "@/features/chat/format";
import { Thread } from "@/features/chat/thread";
import { LoadStatusChip } from "@/features/loads/load-status-chip";
import { ActionError } from "@/server/actions/safe-action";
import { chatActorFromViewer, getConversation } from "@/server/chat/service";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Messages" };

async function load(conversationId: string) {
  const viewer = await getViewer();
  try {
    return { viewer, data: await getConversation(chatActorFromViewer(viewer), conversationId) };
  } catch (error) {
    if (error instanceof ActionError) notFound();
    throw error;
  }
}

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const { viewer, data } = await load(conversationId);
  const c = data.conversation;
  const header = (
    <header className="flex items-center gap-2 border-b border-outline-variant/60 py-2 pr-3 pl-1 medium:pl-3">
      <Link href="/app/messages" aria-label="Back to conversations" className="state-layer inline-flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant expanded:hidden">
        <Icon icon={arrowBackIcon} />
      </Link>
      <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-full text-title-sm font-medium ${avatarTone(c.counterpart)}`}>
        {initials(c.counterpart)}
      </span>
      <div className="min-w-0 flex-1 pl-1">
        <h2 className="truncate text-title-md text-on-surface">{c.counterpart}</h2>
        <Link href={c.loadHref} className="block truncate text-body-md text-on-surface-variant hover:text-primary hover:underline">
          {c.loadPublicId} · {c.loadTitle}
        </Link>
      </div>
      <span className="hidden shrink-0 medium:block">
        <LoadStatusChip status={c.loadStatus} size="sm" />
      </span>
    </header>
  );
  return <Thread key={c.id} conversation={c} initialMessages={data.messages} initialHasMore={data.hasMore} viewerId={viewer.user.id} header={header} />;
}
