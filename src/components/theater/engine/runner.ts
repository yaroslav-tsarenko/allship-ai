import { applyPatch } from "../define";
import type { DeviceKind, EaseName, Patch, Step } from "../types";
import {
  aimPoint,
  arcControls,
  bezierPoint,
  charDelay,
  cursorEase,
  eases,
  timing,
  travelMs,
  type Point,
  type Rect,
} from "./geometry";

export type ScrollPlan = { from: number; to: number; apply: (y: number) => void };

export type StageApi<S> = {
  getState: () => S;
  setState: (next: S) => void;
  restore: () => void;
  fade: (alpha: number) => void;
  locate: (target: string) => Rect | null;
  autoScroll: (target: string) => ScrollPlan | null;
  scrollPlan: (container: string, to: number | string) => ScrollPlan | null;
  home: () => Point;
  getCursor: () => Point;
  setCursor: (p: Point) => void;
  cursorVisible: (on: boolean) => void;
  cursorMode: (mode: "pointer" | "text") => void;
  hover: (target: string | null) => void;
  press: (target: string) => void;
  release: () => void;
  focus: (target: string | null) => void;
  highlight: (target: string | null, label?: string) => void;
  getDevice: () => DeviceKind;
  morph: (from: DeviceKind, to: DeviceKind, t: number) => void;
  commitDevice: (to: DeviceKind) => void;
};

type Seg = {
  step: number;
  ms?: number;
  begin?: () => number | void;
  update?: (p: number) => void;
  end?: () => void;
};

type Background = { key: string; from: number; to: number; ms: number; t: number; ease: EaseName };

export type PlayerOptions<S> = {
  steps: Step<S>[];
  stage: StageApi<S>;
  loop?: boolean;
  onChapter?: (index: number, text: string) => void;
  onStep?: (index: number) => void;
  onFinish?: () => void;
};

export type Player = {
  tick: (dtMs: number) => void;
  play: () => void;
  pause: () => void;
  restart: () => void;
  readonly playing: boolean;
  readonly finished: boolean;
  readonly chapter: number;
  readonly step: number;
};

export function createPlayer<S>({
  steps,
  stage,
  loop = false,
  onChapter,
  onStep,
  onFinish,
}: PlayerOptions<S>): Player {
  let bend = 1;
  let chapter = -1;
  let cycle = 0;
  let background: Background[] = [];

  const apply = (patch: Patch<S>) => stage.setState(applyPatch(stage.getState(), patch));
  const setKey = (key: string, value: unknown) => stage.setState({ ...stage.getState(), [key]: value });

  const travel = (step: number, target: string, ms?: number): Seg => {
    let from: Point = { x: 0, y: 0 };
    let to: Point | null = null;
    let c1: Point = from;
    let c2: Point = from;
    let plan: ScrollPlan | null = null;
    return {
      step,
      begin: () => {
        stage.hover(null);
        to = null;
        plan = null;
        from = stage.getCursor();
        const rect = stage.locate(target);
        if (!rect) return 0;
        plan = stage.autoScroll(target);
        const shift = plan ? plan.to - plan.from : 0;
        to = aimPoint({ ...rect, top: rect.top - shift });
        bend = -bend;
        [c1, c2] = arcControls(from, to, bend);
        stage.cursorVisible(true);
        const d = ms ?? travelMs(from, to);
        return plan ? Math.max(d, timing.scroll) : d;
      },
      update: (p) => {
        if (plan) plan.apply(plan.from + (plan.to - plan.from) * eases.inOut(Math.min(1, p * 1.1)));
        if (to) stage.setCursor(bezierPoint(from, c1, c2, to, cursorEase(p)));
      },
      end: () => {
        if (plan) plan.apply(plan.to);
        if (to) {
          stage.setCursor(to);
          stage.hover(target);
        }
      },
    };
  };

  const press = (step: number, target: string): Seg => ({
    step,
    ms: timing.press,
    begin: () => stage.press(target),
  });
  const release = (step: number, then: () => void): Seg => ({
    step,
    ms: timing.release,
    begin: () => {
      stage.release();
      then();
    },
  });
  const now = (step: number, fn: () => void): Seg => ({ step, ms: 0, begin: () => fn() });

  const compile = (): Seg[] => {
    const segs: Seg[] = [
      {
        step: -1,
        ms: timing.lead,
        begin: () => {
          stage.setCursor(stage.home());
          stage.cursorVisible(true);
          if (cycle === 0) stage.fade(1);
        },
        update: (p) => {
          if (cycle > 0) stage.fade(Math.min(1, p * 1.6));
        },
      },
    ];
    steps.forEach((s, i) => {
      switch (s.kind) {
        case "move":
          segs.push(travel(i, s.target, s.ms));
          break;
        case "click":
          segs.push(
            now(i, () => {
              stage.focus(null);
              stage.cursorMode("pointer");
            }),
            travel(i, s.target, s.ms),
            press(i, s.target),
            release(i, () => {
              stage.hover(null);
              if (s.patch) apply(s.patch);
            }),
          );
          break;
        case "type": {
          segs.push(
            now(i, () => stage.focus(null)),
            travel(i, s.target),
            now(i, () => stage.cursorMode("text")),
            press(i, s.target),
            release(i, () => {
              stage.focus(s.target);
              setKey(s.key, "");
            }),
          );
          for (let c = 0; c < s.text.length; c++) {
            const value = s.text.slice(0, c + 1);
            segs.push({
              step: i,
              ms: charDelay(s.text[c]!, c, s.ms ?? timing.char),
              end: () => setKey(s.key, value),
            });
          }
          break;
        }
        case "stream": {
          let shown = -1;
          segs.push({
            step: i,
            ms: s.text.length * (s.ms ?? timing.stream),
            begin: () => {
              shown = -1;
            },
            update: (p) => {
              const raw = Math.floor(p * s.text.length);
              const cut =
                raw >= s.text.length ? s.text.length : Math.max(0, s.text.lastIndexOf(" ", raw) + 1);
              if (cut !== shown) {
                shown = cut;
                setKey(s.key, s.text.slice(0, cut));
              }
            },
          });
          break;
        }
        case "tween": {
          if (s.parallel) {
            segs.push(
              now(i, () => {
                const v = stage.getState()[s.key as keyof S];
                background = background.filter((b) => b.key !== s.key);
                background.push({
                  key: s.key,
                  from: typeof v === "number" ? v : 0,
                  to: s.to,
                  ms: s.ms,
                  t: 0,
                  ease: s.ease ?? "linear",
                });
              }),
            );
            break;
          }
          let from = 0;
          const fn = eases[s.ease ?? "inOut"];
          segs.push({
            step: i,
            ms: s.ms,
            begin: () => {
              const v = stage.getState()[s.key as keyof S];
              from = typeof v === "number" ? v : 0;
            },
            update: (p) => setKey(s.key, from + (s.to - from) * fn(p)),
          });
          break;
        }
        case "set":
          segs.push(now(i, () => apply(s.patch)));
          break;
        case "wait":
          segs.push({ step: i, ms: s.ms });
          break;
        case "scroll": {
          let plan: ScrollPlan | null = null;
          segs.push({
            step: i,
            ms: s.ms ?? timing.scroll,
            begin: () => {
              stage.hover(null);
              plan = stage.scrollPlan(s.container, s.to);
              if (!plan) return 0;
            },
            update: (p) => {
              if (plan) plan.apply(plan.from + (plan.to - plan.from) * eases.inOut(p));
            },
          });
          break;
        }
        case "device": {
          let from: DeviceKind = "desktop";
          let active = false;
          segs.push(
            {
              step: i,
              ms: s.ms ?? timing.device,
              begin: () => {
                from = stage.getDevice();
                active = from !== s.to;
                if (!active) return 0;
                stage.hover(null);
                stage.focus(null);
                stage.highlight(null);
                stage.cursorVisible(false);
              },
              update: (p) => {
                if (active) stage.morph(from, s.to, eases.inOut(p));
              },
              end: () => {
                if (!active) return;
                stage.commitDevice(s.to);
                stage.setCursor(stage.home());
                stage.cursorMode("pointer");
              },
            },
            {
              step: i,
              ms: 220,
              end: () => {
                if (active) stage.cursorVisible(true);
              },
            },
          );
          break;
        }
        case "highlight": {
          let plan: ScrollPlan | null = null;
          segs.push(
            {
              step: i,
              ms: timing.scroll,
              begin: () => {
                plan = stage.autoScroll(s.target);
                if (!plan) return 0;
              },
              update: (p) => {
                if (plan) plan.apply(plan.from + (plan.to - plan.from) * eases.inOut(p));
              },
            },
            {
              step: i,
              ms: s.ms ?? timing.highlight,
              begin: () => stage.highlight(s.target, s.label),
              end: () => stage.highlight(null),
            },
            { step: i, ms: timing.highlightGap },
          );
          break;
        }
        case "caption":
          segs.push(
            now(i, () => {
              chapter += 1;
              onChapter?.(chapter, s.text);
            }),
          );
          break;
      }
    });
    segs.push({
      step: steps.length,
      ms: timing.tail,
      begin: () => {
        stage.hover(null);
        stage.cursorMode("pointer");
      },
    });
    if (loop) segs.push({ step: steps.length, ms: timing.fade, update: (p) => stage.fade(1 - p) });
    return segs;
  };

  const segs = compile();
  let index = 0;
  let elapsed = 0;
  let duration = 0;
  let begun = false;
  let playing = false;
  let finished = false;
  let lastStep = -2;

  const reset = () => {
    index = 0;
    elapsed = 0;
    begun = false;
    finished = false;
    chapter = -1;
    background = [];
    lastStep = -2;
    stage.restore();
    onChapter?.(-1, "");
  };

  const tickBackground = (dt: number) => {
    if (background.length === 0) return;
    let state = stage.getState();
    for (const b of background) {
      b.t = Math.min(b.ms, b.t + dt);
      const p = b.ms > 0 ? b.t / b.ms : 1;
      state = { ...state, [b.key]: b.from + (b.to - b.from) * eases[b.ease](p) };
    }
    background = background.filter((b) => b.t < b.ms);
    stage.setState(state);
  };

  const advance = (dt: number) => {
    let budget = dt;
    for (;;) {
      const seg = segs[index];
      if (!seg) {
        if (loop) {
          cycle += 1;
          reset();
          continue;
        }
        finished = true;
        playing = false;
        onFinish?.();
        return;
      }
      if (!begun) {
        begun = true;
        elapsed = 0;
        const r = seg.begin?.();
        duration = typeof r === "number" ? r : (seg.ms ?? 0);
        if (seg.step !== lastStep) {
          lastStep = seg.step;
          onStep?.(seg.step);
        }
      }
      if (duration <= 0) {
        seg.update?.(1);
        seg.end?.();
        index += 1;
        begun = false;
        continue;
      }
      const take = Math.min(budget, duration - elapsed);
      elapsed += take;
      budget -= take;
      seg.update?.(Math.min(1, elapsed / duration));
      if (elapsed >= duration) {
        seg.end?.();
        index += 1;
        begun = false;
        continue;
      }
      return;
    }
  };

  return {
    tick(dtMs) {
      if (!playing || finished) return;
      const dt = Math.max(0, Math.min(dtMs, 100));
      tickBackground(dt);
      advance(dt);
    },
    play() {
      if (finished) {
        cycle = 0;
        reset();
      }
      playing = true;
    },
    pause() {
      playing = false;
    },
    restart() {
      cycle = 0;
      reset();
      playing = true;
    },
    get playing() {
      return playing;
    },
    get finished() {
      return finished;
    },
    get chapter() {
      return chapter;
    },
    get step() {
      return lastStep;
    },
  };
}
