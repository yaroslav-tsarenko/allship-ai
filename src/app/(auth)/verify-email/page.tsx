import type { Metadata } from "next";
import { z } from "zod";
import { AuthShell } from "@/features/auth/auth-shell";
import { VerifyEmailPanel } from "@/features/auth/verify-email-panel";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const parsed = z.email().safeParse(email);
  return (
    <AuthShell title="Check your email" description="One more step before you can post loads or bid.">
      <VerifyEmailPanel email={parsed.success ? parsed.data : null} />
    </AuthShell>
  );
}
