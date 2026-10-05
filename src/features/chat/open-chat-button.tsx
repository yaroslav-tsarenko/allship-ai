import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { chatIcon } from "@/components/ui/icons.generated";
import { chatActorFromViewer, conversationForLoad } from "@/server/chat/service";
import { getViewer } from "@/server/viewer/viewer";

export async function OpenChatButton({ loadId, label = "Message", variant = "tonal" }: { loadId: string; label?: string; variant?: "filled" | "tonal" | "outlined" | "text" }) {
  const viewer = await getViewer();
  const conversation = await conversationForLoad(chatActorFromViewer(viewer), loadId).catch(() => null);
  if (!conversation) return null;
  return (
    <Button asChild variant={variant}>
      <Link href={`/app/messages/${conversation.id}`}>
        <Icon icon={chatIcon} size={18} />
        {label}
      </Link>
    </Button>
  );
}
