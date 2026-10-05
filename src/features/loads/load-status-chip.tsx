import { StatusChip } from "@/components/ui/status-chip";
import { statusLabels } from "@/server/loads/transitions";
import type { LoadStatus } from "@/server/db/schema/enums";
import { statusPresentation } from "./presentation";

export function LoadStatusChip({ status, size = "md" }: { status: LoadStatus; size?: "sm" | "md" }) {
  const p = statusPresentation[status];
  return (
    <StatusChip tone={p.tone} icon={p.icon} size={size}>
      {statusLabels[status]}
    </StatusChip>
  );
}
