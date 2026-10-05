import { StatusChip, type Tone } from "@/features/admin/status-chip";
import type { PostStatus } from "./rules";

const map: Record<PostStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "warning" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
};

export function PostStatusChip({ status, className }: { status: PostStatus; className?: string }) {
  const s = map[status] ?? map.draft;
  return <StatusChip label={s.label} tone={s.tone} className={className} />;
}
