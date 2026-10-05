import { cn } from "@/lib/cn";

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn("border-0 border-t border-outline-variant", className)} />;
  return (
    <div className={cn("flex items-center gap-4 text-label-md text-on-surface-variant", className)} role="separator">
      <span className="h-px flex-1 bg-outline-variant" />
      {label}
      <span className="h-px flex-1 bg-outline-variant" />
    </div>
  );
}
