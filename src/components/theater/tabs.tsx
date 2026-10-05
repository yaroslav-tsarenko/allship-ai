import "./theater.css";
import { captionsOf } from "./define";
import { scenes } from "./scenes";
import { boxFor, defaultDevice, Poster, posterDevice } from "./still";
import { TheaterTabsClient } from "./tabs-client";
import type { SceneId, TheaterDevice } from "./types";

export type TheaterTabsProps = {
  tabs: { scene: SceneId; label: string }[];
  device?: TheaterDevice;
  caption?: string;
  label?: string;
  className?: string;
};

export function TheaterTabs({ tabs, device, caption, label = "Product tour", className }: TheaterTabsProps) {
  const first = scenes[tabs[0]!.scene];
  const firstDevice = device ?? defaultDevice(first);
  const meta = tabs.map((t) => {
    const scene = scenes[t.scene];
    const dev = device ?? defaultDevice(scene);
    return {
      scene: t.scene,
      label: t.label,
      title: scene.summary,
      captions: captionsOf(scene),
      box: boxFor(scene, dev),
      device: dev,
    };
  });
  return (
    <TheaterTabsClient
      tabs={meta}
      caption={caption}
      label={label}
      className={className}
      poster={<Poster scene={first} device={posterDevice(first, firstDevice)} />}
    />
  );
}
