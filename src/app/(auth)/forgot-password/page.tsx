import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="Enter the email you use for AllShip AI. We will send you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
