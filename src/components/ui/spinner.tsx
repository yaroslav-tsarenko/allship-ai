import { cn } from "@/lib/cn";

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("m3-spinner shrink-0 animate-[m3-spinner-rotate_1.4s_linear_infinite]", className)}
      role="progressbar"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.24" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="14 90"
        className="m3-spinner-arc origin-center -rotate-90 animate-[m3-spinner-arc_1.4s_var(--ease-standard)_infinite]"
      />
    </svg>
  );
}
