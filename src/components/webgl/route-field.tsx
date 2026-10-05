import { Icon } from "@/components/ui/icon";
import { pauseIcon, playArrowIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import type { RouteFieldVariant } from "./config";
import { RouteFieldPoster } from "./poster";
import { RouteFieldCanvas } from "./route-field-canvas";

export type RouteFieldProps = { variant?: RouteFieldVariant; intensity?: number; className?: string };

export function RouteField({ variant = "hero", intensity = 1, className }: RouteFieldProps) {
  return (
    <div data-route-field={variant} className={cn("pointer-events-none absolute inset-0 isolate overflow-hidden bg-surface", className)}>
      <div aria-hidden="true" className="absolute inset-0">
        <RouteFieldPoster variant={variant} />
      </div>
      <RouteFieldCanvas variant={variant} intensity={intensity} pauseIcon={<Icon icon={pauseIcon} size={20} />} playIcon={<Icon icon={playArrowIcon} size={20} />} />
    </div>
  );
}

export type { RouteFieldVariant };
