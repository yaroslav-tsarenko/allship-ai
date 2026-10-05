import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <AuthShell title="Choose a new password" description="Signing in with the new password will sign you out on your other devices.">
      <ResetPasswordForm token={error ? null : (token ?? null)} />
    </AuthShell>
  );
}
