import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { forumIcon } from "@/components/ui/icons.generated";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <Icon icon={forumIcon} size={48} className="text-on-surface-variant/60" />
      <p className="max-w-[320px] text-body-lg text-on-surface-variant">Pick a conversation to read and reply. Each booked load has its own thread.</p>
    </div>
  );
}
