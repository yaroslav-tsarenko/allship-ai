import "./theater.css";
import { captionsOf } from "./define";
import { scenes } from "./scenes";
import { TheaterStage } from "./stage";
import { boxFor, defaultDevice, Poster, posterDevice, Still } from "./still";
import type { SceneId, TheaterDevice } from "./types";

export type TheaterProps = {
  scene: SceneId;
  device?: TheaterDevice;
  caption?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  steps?: boolean;
  exclusive?: boolean;
  external?: boolean;
  poster?: "full" | "lite";
  className?: string;
};

export function Theater({
  scene: id,
  device,
  caption,
  title,
  autoPlay = true,
  loop = true,
  steps = false,
  exclusive = true,
  external = false,
  poster = "lite",
  className,
}: TheaterProps) {
  const scene = scenes[id];
  const dev = device ?? defaultDevice(scene);
  return (
    <TheaterStage
      sceneId={id}
      device={dev}
      box={boxFor(scene, dev)}
      title={title ?? scene.summary}
      caption={caption}
      captions={captionsOf(scene)}
      autoPlay={autoPlay}
      loop={loop}
      showSteps={steps}
      exclusive={exclusive}
      external={external}
      className={className}
      poster={
        poster === "full" ? (
          <Still scene={scene} device={posterDevice(scene, dev)} state={scene.initial} />
        ) : (
          <Poster scene={scene} device={posterDevice(scene, dev)} />
        )
      }
    />
  );
}
