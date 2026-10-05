"use client";

import { ErrorView } from "@/components/feedback/error-view";

export default function AuthError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>Something went wrong · AllShip AI</title>
      <ErrorView error={error} retry={retry} surface="auth" fullScreen />
    </>
  );
}
