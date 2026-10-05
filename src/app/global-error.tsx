"use client";

import dynamic from "next/dynamic";
import "@/styles/globals.css";

const ErrorView = dynamic(() => import("@/components/feedback/error-view").then((m) => m.ErrorView), { ssr: false });

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong · AllShip AI</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="min-h-dvh bg-surface font-sans text-on-surface antialiased">
        <ErrorView error={error} retry={retry} surface="marketing" fullScreen />
      </body>
    </html>
  );
}
