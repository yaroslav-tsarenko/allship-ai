"use client";

import dynamic from "next/dynamic";

const ErrorView = dynamic(() => import("@/components/feedback/error-view").then((m) => m.ErrorView), {
  ssr: false,
});

export default function LandingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <title>Something went wrong · AllShip AI</title>
      <ErrorView error={error} retry={retry} surface="marketing" fullScreen />
    </>
  );
}
