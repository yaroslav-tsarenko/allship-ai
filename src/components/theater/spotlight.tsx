import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { captionsOf } from "./define";
import { scenes } from "./scenes";
import { TheaterSteps, TheaterSync } from "./sync";
import { Theater } from "./theater";
import type { SceneId, TheaterDevice } from "./types";

export type FeatureSpotlightProps = {
  scene: SceneId;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  device?: TheaterDevice;
  reverse?: boolean;
  headingLevel?: 2 | 3;
  steps?: string[];
  children?: ReactNode;
  className?: string;
};

export function FeatureSpotlight({
  scene,
  title,
  description,
  eyebrow,
  device,
  reverse = false,
  headingLevel = 2,
  steps,
  children,
  className,
}: FeatureSpotlightProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const list = steps ?? captionsOf(scenes[scene]);
  return (
    <TheaterSync>
      <div
        className={cn(
          "expanded:items-start grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 [grid-template-areas:'text'_'theater'_'steps']",
          reverse
            ? "expanded:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] expanded:[grid-template-areas:'theater_text'_'theater_steps']"
            : "expanded:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] expanded:[grid-template-areas:'text_theater'_'steps_theater']",
          className,
        )}
      >
        <div className="expanded:pt-6 [grid-area:text]">
          {eyebrow && (
            <p className="text-label-lg text-primary mb-3 font-medium tracking-wide uppercase">{eyebrow}</p>
          )}
          <Heading className="text-headline-lg text-on-surface expanded:text-display-sm text-balance">
            {title}
          </Heading>
          {description && (
            <div className="text-body-xl text-on-surface-variant mt-4 max-w-[52ch] text-pretty">
              {description}
            </div>
          )}
        </div>
        <div className="[grid-area:theater]">
          <Theater scene={scene} device={device} external />
        </div>
        <div className="[grid-area:steps]">
          <TheaterSteps steps={list} />
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </TheaterSync>
  );
}
