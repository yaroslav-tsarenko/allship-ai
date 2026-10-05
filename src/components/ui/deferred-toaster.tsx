"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { afterLoadIdle } from "@/lib/idle";

const Toaster = dynamic(() => import("./toaster").then((m) => m.Toaster), { ssr: false });

export function DeferredToaster() {
  const [ready, setReady] = useState(false);
  useEffect(() => afterLoadIdle(() => setReady(true)), []);
  return ready ? <Toaster /> : null;
}
