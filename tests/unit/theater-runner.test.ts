import { describe, expect, it } from "vitest";
import { captionsOf, defineScene, resolveEnd } from "@/components/theater/define";
import { createPlayer, type StageApi } from "@/components/theater/engine/runner";
import type { DeviceKind, Step } from "@/components/theater/types";

type S = { open: boolean; name: string; p: number; t: number };

const initial: S = { open: false, name: "", p: 0, t: 0 };

function mockStage(start: S = initial) {
  const log: string[] = [];
  let state = start;
  let device: DeviceKind = "desktop";
  let cursor = { x: 0, y: 0 };
  const rects: Record<string, { left: number; top: number; width: number; height: number }> = {
    open: { left: 100, top: 100, width: 80, height: 40 },
    name: { left: 300, top: 200, width: 240, height: 56 },
  };
  const stage: StageApi<S> = {
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    restore: () => {
      log.push("restore");
      state = start;
      device = "desktop";
    },
    fade: () => {},
    locate: (t) => rects[t] ?? null,
    autoScroll: () => null,
    scrollPlan: () => null,
    home: () => ({ x: 10, y: 10 }),
    getCursor: () => cursor,
    setCursor: (p) => {
      cursor = p;
    },
    cursorVisible: () => {},
    cursorMode: (m) => log.push(`mode:${m}`),
    hover: () => {},
    press: (t) => log.push(`press:${t}`),
    release: () => log.push("release"),
    focus: (t) => {
      if (t) log.push(`focus:${t}`);
    },
    highlight: (t) => log.push(t ? `highlight:${t}` : "highlight:off"),
    getDevice: () => device,
    morph: () => {},
    commitDevice: (to) => {
      device = to;
      log.push(`device:${to}`);
    },
  };
  return { stage, log, get: () => state, cursor: () => cursor, device: () => device };
}

function run(player: { tick: (dt: number) => void }, ms: number, step = 16) {
  for (let t = 0; t < ms; t += step) player.tick(step);
}

const steps: Step<S>[] = [
  { kind: "caption", text: "Open it" },
  { kind: "click", target: "open", patch: { open: true } },
  { kind: "caption", text: "Type a name" },
  { kind: "type", target: "name", key: "name", text: "Dallas, TX" },
  { kind: "tween", key: "p", to: 1, ms: 400, ease: "linear" },
  { kind: "highlight", target: "name", label: "Here" },
  { kind: "device", to: "phone" },
];

describe("theater runner", () => {
  it("runs steps in order and reports chapters", () => {
    const m = mockStage();
    const chapters: string[] = [];
    let finished = false;
    const player = createPlayer({
      steps,
      stage: m.stage,
      onChapter: (i, text) => i >= 0 && chapters.push(text),
      onFinish: () => (finished = true),
    });
    player.play();
    run(player, 500);
    expect(chapters).toEqual(["Open it"]);
    expect(m.get().open).toBe(false);
    run(player, 1500);
    expect(m.get().open).toBe(true);
    expect(m.log.indexOf("press:open")).toBeLessThan(m.log.indexOf("release"));
    run(player, 3000);
    expect(chapters).toEqual(["Open it", "Type a name"]);
    expect(m.log).toContain("focus:name");
    expect(m.log).toContain("mode:text");
    run(player, 10_000);
    expect(m.get().name).toBe("Dallas, TX");
    expect(m.get().p).toBe(1);
    expect(m.log.indexOf("highlight:name")).toBeLessThan(m.log.indexOf("highlight:off"));
    expect(m.device()).toBe("phone");
    expect(finished).toBe(true);
    expect(player.finished).toBe(true);
  });

  it("types one character at a time", () => {
    const m = mockStage();
    const player = createPlayer({
      steps: [{ kind: "type", target: "name", key: "name", text: "Denver" }],
      stage: m.stage,
    });
    player.play();
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      player.tick(10);
      seen.add(m.get().name);
    }
    expect([...seen].filter(Boolean)).toEqual(["D", "De", "Den", "Denv", "Denve", "Denver"]);
  });

  it("moves the cursor to the target before clicking", () => {
    const m = mockStage();
    const player = createPlayer({ steps: [{ kind: "click", target: "open" }], stage: m.stage });
    player.play();
    run(player, 3000);
    expect(m.cursor().x).toBeGreaterThan(100);
    expect(m.cursor().x).toBeLessThan(180);
    expect(m.cursor().y).toBeGreaterThan(100);
    expect(m.cursor().y).toBeLessThan(140);
  });

  it("pauses and resumes without losing its place", () => {
    const m = mockStage();
    const player = createPlayer({
      steps: [{ kind: "tween", key: "t", to: 100, ms: 1000, ease: "linear" }],
      stage: m.stage,
    });
    player.play();
    run(player, 450 + 500);
    const mid = m.get().t;
    expect(mid).toBeGreaterThan(40);
    expect(mid).toBeLessThan(60);
    player.pause();
    run(player, 2000);
    expect(m.get().t).toBe(mid);
    expect(player.playing).toBe(false);
    player.play();
    run(player, 600);
    expect(m.get().t).toBe(100);
  });

  it("clamps long frames so a hidden tab does not skip the script", () => {
    const m = mockStage();
    const player = createPlayer({
      steps: [
        { kind: "wait", ms: 500 },
        { kind: "set", patch: { open: true } },
      ],
      stage: m.stage,
    });
    player.play();
    player.tick(10_000);
    expect(m.get().open).toBe(false);
  });

  it("runs parallel tweens alongside later steps", () => {
    const m = mockStage();
    const player = createPlayer({
      steps: [
        { kind: "tween", key: "t", to: 1, ms: 1000, ease: "linear", parallel: true },
        { kind: "click", target: "open", patch: { open: true } },
      ],
      stage: m.stage,
    });
    player.play();
    run(player, 1200);
    expect(m.get().t).toBeGreaterThan(0.5);
    run(player, 1200);
    expect(m.get().t).toBe(1);
    expect(m.get().open).toBe(true);
  });

  it("loops by restoring the initial state", () => {
    const m = mockStage();
    let finished = false;
    const player = createPlayer({
      steps: [{ kind: "set", patch: { open: true } }],
      stage: m.stage,
      loop: true,
      onFinish: () => (finished = true),
    });
    player.play();
    run(player, 600);
    expect(m.get().open).toBe(true);
    run(player, 3000);
    expect(m.log).toContain("restore");
    expect(finished).toBe(false);
    expect(player.playing).toBe(true);
  });

  it("restarts from the beginning after finishing", () => {
    const m = mockStage();
    const player = createPlayer({ steps: [{ kind: "set", patch: { open: true } }], stage: m.stage });
    player.play();
    run(player, 4000);
    expect(player.finished).toBe(true);
    player.play();
    expect(m.get().open).toBe(false);
    expect(player.finished).toBe(false);
  });

  it("skips the cursor move when a target is missing but still applies the patch", () => {
    const m = mockStage();
    const player = createPlayer({
      steps: [{ kind: "click", target: "nowhere", patch: { open: true } }],
      stage: m.stage,
    });
    player.play();
    run(player, 1000);
    expect(m.get().open).toBe(true);
    expect(m.cursor()).toEqual({ x: 10, y: 10 });
  });
});

describe("theater scripts", () => {
  const scene = defineScene<S>({
    id: "postLoad",
    title: "Test",
    summary: "Test scene",
    url: "/app",
    device: "desktop",
    initial,
    View: () => null,
    script: ({ caption, click, type, tween, set, device, wait }) => [
      caption("First"),
      click("open", { open: true }),
      type("name", "Denver, CO"),
      tween("p", 0.5, 300),
      set((s) => ({ t: s.p * 2 })),
      wait(100),
      caption("Second"),
      device("phone"),
    ],
  });

  it("builds typed steps from the script builder", () => {
    expect(scene.steps.map((s) => s.kind)).toEqual([
      "caption",
      "click",
      "type",
      "tween",
      "set",
      "wait",
      "caption",
      "device",
    ]);
    expect(scene.frame).toBe("device");
  });

  it("lists captions for the step list", () => {
    expect(captionsOf(scene)).toEqual(["First", "Second"]);
  });

  it("resolves the reduced-motion end state without running the timeline", () => {
    const end = resolveEnd(scene);
    expect(end.state).toEqual({ open: true, name: "Denver, CO", p: 0.5, t: 1 });
    expect(end.device).toBe("phone");
  });

  it("lets a scene override its end frame", () => {
    expect(resolveEnd({ ...scene, end: { open: false } }).state.open).toBe(false);
  });
});
