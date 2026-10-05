import type { ComponentType } from "react";

export type DeviceKind = "desktop" | "tablet" | "phone";
export type TheaterDevice = "desktop" | "phone" | "auto";
export type EaseName = "linear" | "inOut" | "out" | "in";

export type SceneId =
  | "postLoad"
  | "bidsCompare"
  | "aiAssistant"
  | "carrierBoard"
  | "instantQuote"
  | "liveTracking"
  | "driverTrip"
  | "fleet"
  | "chat"
  | "escrowFlow"
  | "adaptive"
  | "rateCard"
  | "aiDraftLoad"
  | "aiDraftBid"
  | "guidedTour";

export type StringKeys<S> = { [K in keyof S]-?: S[K] extends string ? K : never }[keyof S] & string;
export type NumberKeys<S> = { [K in keyof S]-?: S[K] extends number ? K : never }[keyof S] & string;

export type Patch<S> = Partial<S> | ((s: S) => Partial<S>);

export type Step<S> =
  | { kind: "move"; target: string; ms?: number }
  | { kind: "click"; target: string; patch?: Patch<S>; ms?: number }
  | { kind: "type"; target: string; key: StringKeys<S>; text: string; ms?: number }
  | { kind: "stream"; key: StringKeys<S>; text: string; ms?: number }
  | { kind: "tween"; key: NumberKeys<S>; to: number; ms: number; ease?: EaseName; parallel?: boolean }
  | { kind: "set"; patch: Patch<S> }
  | { kind: "wait"; ms: number }
  | { kind: "scroll"; container: string; to: number | string; ms?: number }
  | { kind: "device"; to: DeviceKind; ms?: number }
  | { kind: "highlight"; target: string; label: string; ms?: number }
  | { kind: "caption"; text: string };

export type SceneViewProps<S> = { s: S; device: DeviceKind; focus: string | null };

export type SceneFrameKind = "device" | "bare";

export type SceneDef<S> = {
  id: SceneId;
  title: string;
  summary: string;
  url: string | ((s: S) => string);
  device: DeviceKind;
  frame: SceneFrameKind;
  initial: S;
  end?: Partial<S>;
  steps: Step<S>[];
  View: ComponentType<SceneViewProps<S>>;
};

export type AnyScene = SceneDef<Record<string, unknown>>;
