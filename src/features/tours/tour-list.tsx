"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon } from "@/components/ui/icons.generated";
import { tourDefinitions } from "./definitions";
import { tourMeta, type TourId } from "./ids";
import { useTours } from "./tour-provider";

export function TourList({ tourIds }: { tourIds: TourId[] }) {
  const { start, isCompleted } = useTours();
  return (
    <ul>
      {tourIds.map((id) => {
        const done = isCompleted(id);
        return (
          <li key={id} className="flex items-center gap-4 border-t border-outline-variant px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-body-lg text-on-surface">{tourMeta[id].title}</p>
              <p className="text-body-md text-on-surface-variant">{tourDefinitions[id].summary}</p>
              {done && (
                <p className="mt-1 inline-flex items-center gap-1 text-label-md text-success">
                  <Icon icon={checkCircleIcon} size={16} filled />
                  Completed
                </p>
              )}
            </div>
            <Button variant={done ? "text" : "tonal"} onClick={() => start(id)} aria-label={`${done ? "Replay" : "Start"} tour: ${tourMeta[id].title}`}>
              {done ? "Replay" : "Start"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
