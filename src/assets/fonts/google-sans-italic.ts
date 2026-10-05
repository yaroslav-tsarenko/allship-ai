import localFont from "next/font/local";

export const googleSans = localFont({
  src: [{ path: "./google-sans-latin-wght-italic.woff2", weight: "400 700", style: "italic" }],
  variable: "--font-google-sans-italic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});
