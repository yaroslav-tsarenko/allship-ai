import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { TwoFactorForm } from "@/features/auth/two-factor-form";

export const metadata: Metadata = { title: "2-Step Verification" };

export default function TwoFactorPage() {
  return (
    <AuthShell title="2-Step Verification" description="This extra step shows it is really you signing in.">
      <TwoFactorForm />
    </AuthShell>
  );
}
