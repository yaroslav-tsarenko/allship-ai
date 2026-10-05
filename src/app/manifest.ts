import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AllShip AI",
    short_name: "AllShip",
    description: "Ship moves, vehicles and freight with FMCSA-verified carriers. Pay into escrow, release on delivery.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f9f9ff",
    theme_color: "#005bb3",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
