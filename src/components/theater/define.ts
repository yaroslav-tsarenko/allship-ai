import type { AnyScene, DeviceKind, EaseName, NumberKeys, Patch, SceneDef, Step, StringKeys } from "./types";

export type ScriptBuilder<S> = {
  move: (target: string, opts?: { ms?: number }) => Step<S>;
  click: (target: string, patch?: Patch<S>, opts?: { ms?: number }) => Step<S>;
  type: (target: string, text: string, opts?: { key?: StringKeys<S>; ms?: number }) => Step<S>;
  stream: (key: StringKeys<S>, text: string, opts?: { ms?: number }) => Step<S>;
  tween: (
    key: NumberKeys<S>,
    to: number,
    ms: number,
    opts?: { ease?: EaseName; parallel?: boolean },
  ) => Step<S>;
  set: (patch: Patch<S>) => Step<S>;
  wait: (ms: number) => Step<S>;
  scroll: (container: string, to: number | string, opts?: { ms?: number }) => Step<S>;
  device: (to: DeviceKind, opts?: { ms?: number }) => Step<S>;
  highlight: (target: string, label: string, opts?: { ms?: number }) => Step<S>;
  caption: (text: string) => Step<S>;
};

export function scriptBuilder<S>(): ScriptBuilder<S> {
  return {
    move: (target, opts) => ({ kind: "move", target, ms: opts?.ms }),
    click: (target, patch, opts) => ({ kind: "click", target, patch, ms: opts?.ms }),
    type: (target, text, opts) => ({
      kind: "type",
      target,
      key: (opts?.key ?? target) as StringKeys<S>,
      text,
      ms: opts?.ms,
    }),
    stream: (key, text, opts) => ({ kind: "stream", key, text, ms: opts?.ms }),
    tween: (key, to, ms, opts) => ({
      kind: "tween",
      key,
      to,
      ms,
      ease: opts?.ease,
      parallel: opts?.parallel,
    }),
    set: (patch) => ({ kind: "set", patch }),
    wait: (ms) => ({ kind: "wait", ms }),
    scroll: (container, to, opts) => ({ kind: "scroll", container, to, ms: opts?.ms }),
    device: (to, opts) => ({ kind: "device", to, ms: opts?.ms }),
    highlight: (target, label, opts) => ({ kind: "highlight", target, label, ms: opts?.ms }),
    caption: (text) => ({ kind: "caption", text }),
  };
}

export type SceneConfig<S> = Omit<SceneDef<S>, "steps" | "frame"> & {
  frame?: SceneDef<S>["frame"];
  script: (b: ScriptBuilder<S>) => Step<S>[];
};

export function defineScene<S>(config: SceneConfig<S>): SceneDef<S> {
  const { script, ...rest } = config;
  return { frame: "device", ...rest, steps: script(scriptBuilder<S>()) };
}

export function applyPatch<S>(state: S, patch: Patch<S>): S {
  return { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
}

export function foldStep<S>(state: S, step: Step<S>): S {
  switch (step.kind) {
    case "click":
      return step.patch ? applyPatch(state, step.patch) : state;
    case "set":
      return applyPatch(state, step.patch);
    case "type":
    case "stream":
      return { ...state, [step.key]: step.text };
    case "tween":
      return { ...state, [step.key]: step.to };
    default:
      return state;
  }
}

export function resolveEnd<S>(scene: Pick<SceneDef<S>, "initial" | "steps" | "device" | "end">): {
  state: S;
  device: DeviceKind;
} {
  let state = scene.initial;
  let device = scene.device;
  for (const step of scene.steps) {
    state = foldStep(state, step);
    if (step.kind === "device") device = step.to;
  }
  return { state: scene.end ? { ...state, ...scene.end } : state, device };
}

export function captionsOf<S>(scene: Pick<SceneDef<S>, "steps">): string[] {
  return scene.steps.flatMap((s) => (s.kind === "caption" ? [s.text] : []));
}

export function morphs<S>(scene: Pick<SceneDef<S>, "steps">) {
  return scene.steps.some((s) => s.kind === "device");
}

export function urlFor<S>(scene: Pick<SceneDef<S>, "url">, state: S) {
  return typeof scene.url === "function" ? scene.url(state) : scene.url;
}

export function erase<S>(scene: SceneDef<S>): AnyScene {
  return scene as unknown as AnyScene;
}
