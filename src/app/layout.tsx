import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { googleSans as googleSansItalic } from "@/assets/fonts/google-sans-italic";
import { consentDefaultsScript, TagManager } from "@/components/marketing/tag-manager";
import { motionBootScript } from "@/components/motion/enter";
import { RippleHost } from "@/components/motion/ripple-host";
import { DeferredToaster } from "@/components/ui/deferred-toaster";
import { env } from "@/env";
import { themeScript, zodJitlessScript } from "@/lib/security/inline-scripts";
import "@/styles/globals.css";

const googleSans = localFont({
  src: [
    { path: "../assets/fonts/google-sans-latin-wght-normal.woff2", weight: "400 700", style: "normal" },
  ],
  variable: "--font-google-sans",
  display: "swap",
  fallback: ["Roboto", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

const googleSansCode = localFont({
  src: [{ path: "../assets/fonts/google-sans-code-latin-wght-normal.woff2", weight: "300 800", style: "normal" }],
  variable: "--font-google-sans-code",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { default: "AllShip AI — Ship, move and haul with verified carriers", template: "%s · AllShip AI" },
  description:
    "Post your move, vehicle, freight or heavy equipment. FMCSA-verified carriers bid, you choose, and your payment stays in escrow until delivery.",
  applicationName: "AllShip AI",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${googleSans.variable} ${googleSansItalic.variable} ${googleSansCode.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: zodJitlessScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: consentDefaultsScript }} />
      </head>
      <body className="min-h-dvh bg-surface text-on-surface antialiased">
        {children}
        <DeferredToaster />
        <RippleHost />
        <TagManager gtmId={env.NEXT_PUBLIC_GTM_ID} />
      </body>
    </html>
  );
}
