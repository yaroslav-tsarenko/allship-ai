import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/env";
import { AuthShell } from "@/features/auth/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ type?: string; email?: string }> }) {
  if (await getSession()) redirect("/app");
  const { type, email } = await searchParams;
  const defaultEmail = z.email().safeParse(email).success ? (email as string) : "";
  return (
    <AuthShell
      title="Create your account"
      description={
        <ul className="mt-2 flex flex-col gap-3 text-body-lg">
          <li>Shippers post a load once and get bids from FMCSA-verified carriers.</li>
          <li>Carriers bid on loads in their lanes and are paid after delivery.</li>
          <li>Payments stay in escrow until the shipment is delivered.</li>
        </ul>
      }
    >
      <SignUpForm googleEnabled={Boolean(env.GOOGLE_CLIENT_ID)} defaultType={type === "carrier" ? "carrier" : "shipper"} defaultEmail={defaultEmail} />
    </AuthShell>
  );
}
