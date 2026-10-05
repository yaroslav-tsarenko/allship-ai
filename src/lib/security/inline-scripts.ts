import { createHash } from "node:crypto";
import { motionBootScript } from "@/components/motion/enter";
import { consentDefaultsScript } from "@/components/marketing/tag-manager";

export const themeScript = `(()=>{try{var t=localStorage.getItem("theme");var p=t==="dark"||t==="light"?t:"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.dataset.themePref=p}catch(e){}})()`;

export const zodJitlessScript = `globalThis.__zod_globalConfig=Object.assign(globalThis.__zod_globalConfig||{},{jitless:true})`;

export const layoutInlineScripts = [
  themeScript,
  zodJitlessScript,
  motionBootScript,
  consentDefaultsScript,
] as const;

export function scriptHash(source: string) {
  return `sha256-${createHash("sha256").update(source, "utf8").digest("base64")}`;
}

export const layoutScriptHashes = layoutInlineScripts.map(scriptHash);
