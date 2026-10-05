"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { onFirstInteraction } from "@/components/motion/interaction";
import { Icon } from "@/components/ui/icon";
import { pauseIcon, playArrowIcon, replayIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { afterLoadIdle } from "@/lib/idle";
import { morphs, resolveEnd } from "./define";
import type { EngineProps } from "./engine/engine";
import { sceneLoaders } from "./scenes/loaders";
import { Still, type BoxKind } from "./still";
import { useTheaterSync } from "./sync";
import type { AnyScene, DeviceKind, SceneId, TheaterDevice } from "./types";

type Entry = { ratio: number; exclusive: boolean; set: (on: boolean) => void };

const registry = new Map<number, Entry>();
let nextId = 0;

function elect() {
  let best: Entry | null = null;
  for (const e of registry.values())
    if (e.exclusive && e.ratio >= 0.2 && (!best || e.ratio > best.ratio)) best = e;
  for (const e of registry.values()) e.set(!e.exclusive || e === best);
}

let enginePromise: Promise<ComponentType<EngineProps>> | null = null;
const loadEngine = () => (enginePromise ??= import("./engine/engine").then((m) => m.default));

function resolveDevice(scene: AnyScene, device: TheaterDevice): DeviceKind {
  if (morphs(scene)) return scene.device;
  if (device !== "auto") return device;
  return window.matchMedia("(min-width: 840px)").matches ? "desktop" : "phone";
}

export type TheaterStageProps = {
  sceneId: SceneId;
  device: TheaterDevice;
  box: BoxKind;
  title: string;
  captions: string[];
  caption?: string;
  poster?: ReactNode;
  autoPlay?: boolean;
  loop?: boolean;
  showSteps?: boolean;
  external?: boolean;
  exclusive?: boolean;
  eager?: boolean;
  onFinish?: () => void;
  className?: string;
};

export function TheaterStage({
  sceneId,
  device,
  box,
  title,
  captions,
  caption,
  poster,
  autoPlay = true,
  loop = true,
  showSteps = false,
  external = false,
  exclusive = true,
  eager = false,
  onFinish,
  className,
}: TheaterStageProps) {
  const rootRef = useRef<HTMLElement>(null);
  const sync = useTheaterSync();
  const [near, setNear] = useState(eager);
  const [ratio, setRatio] = useState(0);
  const [elected, setElected] = useState(!exclusive);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [scene, setScene] = useState<AnyScene | null>(null);
  const [Engine, setEngine] = useState<ComponentType<EngineProps> | null>(null);
  const [resolved, setResolved] = useState<DeviceKind>("desktop");
  const [userPaused, setUserPaused] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const [finished, setFinished] = useState(false);
  const [chapter, setChapter] = useState(-1);
  const [restartKey, setRestartKey] = useState(0);
  const setSyncChapter = sync?.setChapter;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    const onVis = () => setHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    const watch = (rootMargin: string) =>
      new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          setNear(true);
          inView.disconnect();
          nearby.disconnect();
        },
        { rootMargin },
      );
    const inView = watch("0px");
    const nearby = watch("300px 0px");
    const cancelIdle = afterLoadIdle(() => inView.observe(el), 1500);
    const cancelInteraction = onFirstInteraction(() => nearby.observe(el));
    const id = nextId++;
    const entry: Entry = { ratio: 0, exclusive, set: (on) => setElected(on) };
    registry.set(id, entry);
    const viewObs = new IntersectionObserver(
      (entries) => {
        const r = entries[entries.length - 1]?.intersectionRatio ?? 0;
        entry.ratio = r;
        setRatio(r);
        elect();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    viewObs.observe(el);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
      cancelIdle();
      cancelInteraction();
      inView.disconnect();
      nearby.disconnect();
      viewObs.disconnect();
      registry.delete(id);
      elect();
    };
  }, [exclusive]);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    const tasks: Promise<unknown>[] = [sceneLoaders[sceneId]()];
    if (!reduced) tasks.push(loadEngine());
    Promise.all(tasks)
      .then(([s, E]) => {
        if (cancelled) return;
        const sc = s as AnyScene;
        setResolved(resolveDevice(sc, device));
        setScene(sc);
        if (E) setEngine(() => E as ComponentType<EngineProps>);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [near, reduced, sceneId, device]);

  const onChapter = useCallback(
    (i: number) => {
      setChapter(i);
      setSyncChapter?.(i);
    },
    [setSyncChapter],
  );

  const handleFinish = useCallback(() => {
    setFinished(true);
    onFinish?.();
  }, [onFinish]);

  useEffect(() => {
    if (reduced) setSyncChapter?.(captions.length);
  }, [reduced, captions.length, setSyncChapter]);

  const live = Boolean(Engine && scene && !reduced);
  const inView = ratio > 0.05;
  const playing = live && started && !userPaused && !finished && inView && elected && !hidden;

  const toggle = () => {
    if (finished) {
      setFinished(false);
      setUserPaused(false);
      setRestartKey((k) => k + 1);
      return;
    }
    if (!started) {
      setStarted(true);
      setUserPaused(false);
      return;
    }
    setUserPaused((p) => !p);
  };

  let content: ReactNode = poster ?? null;
  if (scene && reduced) {
    const end = resolveEnd(scene);
    content = <Still scene={scene} device={morphs(scene) ? end.device : resolved} state={end.state} />;
  } else if (scene && Engine) {
    content = (
      <Engine
        scene={scene}
        device={resolved}
        playing={playing}
        loop={loop}
        restartKey={restartKey}
        onChapter={onChapter}
        onFinish={handleFinish}
      />
    );
  } else if (scene) {
    content = <Still scene={scene} device={resolved} state={scene.initial} />;
  }

  const paused = !playing;
  const label = finished ? "Replay demo" : paused && (userPaused || !started) ? "Play demo" : "Pause demo";
  const shownChapter = reduced ? -1 : chapter;

  return (
    <figure
      ref={rootRef}
      className={cn("th-root", className)}
      data-paused={paused || undefined}
      aria-label={title}
    >
      <div className="th-box" data-box={box} aria-hidden="true" inert>
        {content}
      </div>
      <div className="mt-3 flex min-h-10 items-center gap-3">
        <p
          aria-hidden="true"
          className="text-body-md text-on-surface-variant flex min-w-0 flex-1 items-baseline gap-3"
        >
          {captions.length > 0 && !reduced && (
            <span className="text-label-md shrink-0 font-mono tabular-nums">
              {String(Math.max(1, shownChapter + 1)).padStart(2, "0")}/
              {String(captions.length).padStart(2, "0")}
            </span>
          )}
          <span key={shownChapter} className="text-on-surface motion-safe:animate-fade-in truncate">
            {reduced ? (caption ?? title) : (captions[Math.max(0, shownChapter)] ?? title)}
          </span>
        </p>
        <span className="text-label-md text-on-surface-variant medium:inline hidden shrink-0">
          Sample data
        </span>
        {!reduced && (
          <button
            type="button"
            onClick={toggle}
            aria-label={label}
            title={label}
            className="state-layer border-outline-variant text-on-surface-variant inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border"
          >
            <Icon
              icon={finished ? replayIcon : label === "Play demo" ? playArrowIcon : pauseIcon}
              size={20}
            />
          </button>
        )}
      </div>
      <figcaption className={cn(caption ? "text-body-md text-on-surface-variant mt-1" : "sr-only")}>
        {caption ?? title}
        <span className="sr-only"> Illustration with sample data.</span>
      </figcaption>
      {!external && (
        <ol
          className={cn(
            showSteps || reduced
              ? "border-outline-variant mt-4 flex flex-col gap-2 border-t pt-4"
              : "sr-only motion-reduce:not-sr-only motion-reduce:mt-4 motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-2",
          )}
        >
          {captions.map((c, i) => (
            <li
              key={c}
              aria-current={!reduced && i === chapter ? "step" : undefined}
              className={cn(
                "text-body-md flex gap-3",
                !reduced && i === chapter ? "text-on-surface" : "text-on-surface-variant",
              )}
            >
              <span
                aria-hidden="true"
                className="text-label-md w-6 shrink-0 font-mono leading-5 tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}
