import "server-only";
import { generateRandomString } from "better-auth/crypto";
import { ActionEmail } from "@/emails/action-email";
import { env } from "@/env";
import { auth } from "@/server/auth/auth";
import { sendEmail } from "@/server/email/send";

export const SETUP_LINK_HOURS = 72;
export const DRIVER_LANDING_PATH = "/app/trips";

export async function createDriverSetupLink(email: string, hours = SETUP_LINK_HOURS) {
  const ctx = await auth.$context;
  const token = generateRandomString(32, "a-z", "A-Z");
  await ctx.internalAdapter.createVerificationValue({
    identifier: `magic-link:${token}`,
    value: JSON.stringify({ type: "magic-link", email: email.trim().toLowerCase() }),
    expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  const url = new URL("/api/auth/magic-link/verify", env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", DRIVER_LANDING_PATH);
  url.searchParams.set("errorCallbackURL", "/sign-in");
  return url.toString();
}

export async function sendDriverSetup(
  to: string,
  {
    firstName,
    companyName,
    inviterName,
  }: { firstName: string | null; companyName: string; inviterName: string },
) {
  const url = await createDriverSetupLink(to);
  return sendEmail({
    to,
    tag: "driver-setup",
    subject: `Set up your driver account for ${companyName}`,
    react: (
      <ActionEmail
        preview={`${inviterName} added you as a driver on AllShip AI`}
        heading={firstName ? `${firstName}, set up your driver account` : "Set up your driver account"}
        intro={`${inviterName} added you as a driver for ${companyName} on AllShip AI. Open the link on your phone to sign in. You'll see the trips assigned to you, confirm pickups and deliveries, and share your location while you drive.`}
        actionLabel="Set up my account"
        url={url}
        footnote={`The link works once and expires in ${SETUP_LINK_HOURS} hours. Later you can sign in with a code sent to this email, or add a password in Settings. If you don't drive for ${companyName}, ignore this email.`}
      />
    ),
  });
}
