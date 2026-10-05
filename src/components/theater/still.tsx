import { morphs, urlFor } from "./define";
import { Frame } from "./frame";
import type { AnyScene, DeviceKind, TheaterDevice } from "./types";

export type BoxKind = "desktop" | "phone" | "auto" | "stage" | "bare" | "bare-phone" | "bare-auto";

export function defaultDevice(scene: AnyScene): TheaterDevice {
  return scene.device === "phone" ? "phone" : "auto";
}

export function boxFor(scene: AnyScene, device: TheaterDevice): BoxKind {
  if (scene.frame === "bare")
    return device === "auto" ? "bare-auto" : device === "phone" ? "bare-phone" : "bare";
  if (morphs(scene)) return "stage";
  return device;
}

export function posterDevice(scene: AnyScene, device: TheaterDevice): DeviceKind | "auto" {
  if (morphs(scene)) return scene.device;
  return device;
}

export function Still({
  scene,
  device,
  state,
}: {
  scene: AnyScene;
  device: DeviceKind | "auto";
  state: Record<string, unknown>;
}) {
  const View = scene.View;
  return (
    <Frame device={device} bare={scene.frame === "bare"} url={urlFor(scene, state)}>
      <View s={state} device={device === "auto" ? scene.device : device} focus={null} />
    </Frame>
  );
}

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-sm ${className}`} />;
}

export function Poster({ scene, device }: { scene: AnyScene; device: DeviceKind | "auto" }) {
  const bare = scene.frame === "bare";
  return (
    <Frame device={device} bare={bare} url={urlFor(scene, scene.initial)}>
      {!bare && (
        <div className="bg-surface flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center gap-3 px-4 @3xl:h-16 @3xl:px-5">
            <Bar className="bg-primary/60 h-5 w-24" />
            <span className="flex-1" />
            <span className="bg-surface-container-high size-8 rounded-full" />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="hidden w-20 shrink-0 flex-col items-center gap-6 py-4 @3xl:flex">
              <span className="bg-secondary-container h-8 w-14 rounded-full" />
              <span className="bg-surface-container h-8 w-14 rounded-full" />
              <span className="bg-surface-container h-8 w-14 rounded-full" />
              <span className="bg-surface-container h-8 w-14 rounded-full" />
            </div>
            <div className="min-w-0 flex-1 px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
              <Bar className="bg-surface-container-highest mt-2 h-8 w-2/5" />
              <Bar className="bg-surface-container-high mt-3 h-4 w-3/5" />
              <div className="mt-8 grid gap-4 @3xl:grid-cols-3">
                <span className="border-outline-variant bg-surface-container-low h-28 rounded-xl border" />
                <span className="border-outline-variant bg-surface-container-low h-28 rounded-xl border" />
                <span className="border-outline-variant bg-surface-container-low hidden h-28 rounded-xl border @3xl:block" />
              </div>
              <span className="bg-surface-container-low mt-4 block h-48 rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </Frame>
  );
}
