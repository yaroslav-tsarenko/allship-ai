import Link from "next/link";
import { getLiveBoardStats } from "@/components/pages/home/live-stats";
import { cn } from "@/lib/cn";

const number = new Intl.NumberFormat("en-US");

export async function LiveLine({ className, linkBoard = true }: { className?: string; linkBoard?: boolean }) {
  const { openLoads, carrierStates } = await getLiveBoardStats();
  if (!openLoads && !carrierStates) return null;
  const loads = (
    <>
      <span className="font-medium text-on-surface tabular-nums">{number.format(openLoads)}</span> open {openLoads === 1 ? "load" : "loads"} taking bids now
    </>
  );
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-body-md text-on-surface-variant", className)}>
      <span aria-hidden="true" className="relative inline-flex size-2">
        <span className="absolute inset-0 rounded-full bg-success motion-safe:animate-ping motion-safe:[animation-duration:2.4s]" />
        <span className="relative size-2 rounded-full bg-success" />
      </span>
      {openLoads > 0 &&
        (linkBoard ? (
          <Link href="/loads" className="rounded-xs underline-offset-4 hover:text-on-surface hover:underline">
            {loads}
          </Link>
        ) : (
          <span>{loads}</span>
        ))}
      {openLoads > 0 && carrierStates > 0 && <span aria-hidden="true">·</span>}
      {carrierStates > 0 && (
        <span>
          Verified carriers serve <span className="font-medium text-on-surface tabular-nums">{carrierStates}</span> {carrierStates === 1 ? "state" : "states"}
        </span>
      )}
    </p>
  );
}
