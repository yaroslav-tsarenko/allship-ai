"use client";

import dynamic from "next/dynamic";
import { publicEnv } from "@/lib/public-env";
import type { FleetMapProps } from "./map-types";
import { SvgFleetMap } from "./svg-fleet-map";

const GoogleFleetMap = dynamic(() => import("./google-fleet-map"), {
  ssr: false,
  loading: () => <div className="bg-surface-container-low size-full animate-pulse" />,
});

export function FleetMap(props: FleetMapProps) {
  const key = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  return key ? <GoogleFleetMap apiKey={key} {...props} /> : <SvgFleetMap {...props} />;
}
