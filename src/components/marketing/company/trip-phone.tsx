import { Icon } from "@/components/ui/icon";
import { checkIcon, drawIcon, locationOnIcon, photoCameraIcon, pinDropIcon, tripOriginIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

const steps = [
  { label: "Assigned", done: true },
  { label: "On the way to pickup", done: true },
  { label: "Picked up", done: true },
  { label: "In transit", current: true },
  { label: "Delivered" },
];

export function TripPhone({ className }: { className?: string }) {
  return (
    <figure className={cn("m-0", className)}>
      <div aria-hidden="true" className="mx-auto w-full max-w-[340px] rounded-[44px] border border-outline-variant bg-surface-container-highest p-3 shadow-elevation-2">
        <div className="overflow-hidden rounded-[34px] bg-surface">
          <div className="flex items-center justify-between px-6 pt-4 pb-2 font-mono text-label-sm text-on-surface-variant">
            <span>Trip</span>
            <span className="flex items-center gap-1 text-success">
              <Icon icon={locationOnIcon} size={14} filled />
              Sharing location
            </span>
          </div>
          <div className="px-5 pb-5">
            <p className="text-title-lg text-on-surface">Household move</p>
            <ol className="mt-3 flex flex-col gap-2 text-body-md text-on-surface">
              <li className="flex items-center gap-2">
                <Icon icon={tripOriginIcon} size={18} className="text-primary" />
                Pickup · Columbus, OH
              </li>
              <li className="flex items-center gap-2">
                <Icon icon={pinDropIcon} size={18} className="text-primary" />
                Delivery · Nashville, TN
              </li>
            </ol>
            <ol className="mt-5 flex flex-col gap-0 rounded-md bg-surface-container-low p-4">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3 py-1.5 text-body-md">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      s.done && "bg-primary text-on-primary",
                      s.current && "border-2 border-primary",
                      !s.done && !s.current && "border border-outline",
                    )}
                  >
                    {s.done && <Icon icon={checkIcon} size={14} />}
                  </span>
                  <span className={cn(s.current ? "font-medium text-on-surface" : s.done ? "text-on-surface" : "text-on-surface-variant")}>{s.label}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <span className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-outline text-label-lg text-primary">
                <Icon icon={photoCameraIcon} size={18} />
                Photo
              </span>
              <span className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-outline text-label-lg text-primary">
                <Icon icon={drawIcon} size={18} />
                Signature
              </span>
            </div>
            <span className="mt-2 flex h-12 items-center justify-center rounded-full bg-primary text-label-lg font-medium text-on-primary">Mark delivered</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-body-sm text-on-surface-variant">An active trip on a driver&apos;s phone. Route is a sample.</figcaption>
    </figure>
  );
}
