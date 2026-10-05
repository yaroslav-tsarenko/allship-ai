import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { AuthShell } from "@/features/auth/auth-shell";
import { safeNext } from "@/features/auth/safe-next";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getSession()) redirect(target);
  return (
    <AuthShell title="Sign in" description="Use your AllShip AI account to manage loads, bids and trips.">
      <SignInForm next={target} googleEnabled={Boolean(env.GOOGLE_CLIENT_ID)} />
    </AuthShell>
  );
}
