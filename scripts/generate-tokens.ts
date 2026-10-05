import { writeFileSync } from "node:fs";
import {
  Hct,
  MaterialDynamicColors,
  SchemeFidelity,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

const SOURCE = "#3F8BF3";
const SEMANTIC = { success: "#51AA4F", warning: "#E9BF00", danger: "#DC493E" } as const;

const roles = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer", "inversePrimary",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "onError", "errorContainer", "onErrorContainer",
  "background", "onBackground", "surface", "onSurface", "surfaceVariant", "onSurfaceVariant",
  "surfaceDim", "surfaceBright", "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer",
  "surfaceContainerHigh", "surfaceContainerHighest", "inverseSurface", "inverseOnSurface",
  "outline", "outlineVariant", "shadow", "scrim", "surfaceTint",
] as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

function scheme(isDark: boolean) {
  const s = new SchemeFidelity(Hct.fromInt(argbFromHex(SOURCE)), isDark, 0);
  const lines: string[] = [];
  for (const role of roles) {
    const dc = (MaterialDynamicColors as unknown as Record<string, { getArgb: (x: unknown) => number }>)[role];
    if (!dc) continue;
    lines.push(`  --md-${kebab(role)}: ${hexFromArgb(dc.getArgb(s))};`);
  }
  for (const [name, hex] of Object.entries(SEMANTIC)) {
    const p = TonalPalette.fromInt(argbFromHex(hex));
    const t = isDark ? { c: 80, on: 20, cont: 30, onCont: 90 } : { c: 40, on: 100, cont: 90, onCont: 10 };
    lines.push(`  --md-${name}: ${hexFromArgb(p.tone(t.c))};`);
    lines.push(`  --md-on-${name}: ${hexFromArgb(p.tone(t.on))};`);
    lines.push(`  --md-${name}-container: ${hexFromArgb(p.tone(t.cont))};`);
    lines.push(`  --md-on-${name}-container: ${hexFromArgb(p.tone(t.onCont))};`);
  }
  return lines.join("\n");
}

const light = scheme(false);
const dark = scheme(true);

const css = `:root {
  color-scheme: light;
${light}
}

:root[data-theme="dark"] {
  color-scheme: dark;
${dark}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${dark.replace(/^/gm, "  ")}
  }
}
`;

writeFileSync(new URL("../src/styles/tokens.css", import.meta.url), css);
console.log("tokens written");
