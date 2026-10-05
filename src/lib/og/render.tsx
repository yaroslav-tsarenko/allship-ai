import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "src/assets/og");
  const [regular, medium] = await Promise.all([readFile(join(dir, "google-sans-400.ttf")), readFile(join(dir, "google-sans-500.ttf"))]);
  return [
    { name: "Google Sans", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Google Sans", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}

async function logoDataUrl() {
  const svg = await readFile(join(process.cwd(), "public/brand/logo.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export async function renderOgImage({ eyebrow, title, footer = "allship.ai" }: { eyebrow?: string; title: string; footer?: string }) {
  const [fontData, logo] = await Promise.all([fonts(), logoDataUrl()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f9f9ff", padding: "64px 72px", fontFamily: "Google Sans" }}>
        <img src={logo} width={273} height={64} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {eyebrow ? <div style={{ fontSize: 30, fontWeight: 500, color: "#005bb3" }}>{eyebrow}</div> : null}
          <div style={{ fontSize: title.length > 60 ? 60 : 72, lineHeight: 1.1, color: "#1a1c20", letterSpacing: "-0.02em", maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#43474e" }}>
          <span>{footer}</span>
          <div style={{ display: "flex", gap: 10 }}>
            {["#4285f4", "#ea4335", "#fbbc04", "#34a853"].map((c) => (
              <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
            ))}
          </div>
        </div>
      </div>
    ),
    { ...ogSize, fonts: fontData },
  );
}
