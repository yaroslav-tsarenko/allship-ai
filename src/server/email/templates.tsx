import "server-only";
import { ActionEmail } from "@/emails/action-email";
import { CodeEmail } from "@/emails/code-email";
import { sendEmail } from "./send";

export const authEmails = {
  verifyEmail: (to: string, url: string) =>
    sendEmail({
      to,
      tag: "verify-email",
      subject: "Confirm your email for AllShip AI",
      react: (
        <ActionEmail
          preview="Confirm your email"
          heading="Confirm your email"
          intro="Tap the button to confirm this address and finish setting up your AllShip AI account."
          actionLabel="Confirm email"
          url={url}
          footnote="The link expires in 1 hour. If you did not create an account, you can ignore this email."
        />
      ),
    }),
  resetPassword: (to: string, url: string) =>
    sendEmail({
      to,
      tag: "reset-password",
      subject: "Reset your AllShip AI password",
      react: (
        <ActionEmail
          preview="Reset your password"
          heading="Reset your password"
          intro="Someone asked to reset the password for this AllShip AI account. If it was you, choose a new password."
          actionLabel="Choose a new password"
          url={url}
          footnote="The link expires in 1 hour. If you did not ask for this, your password stays the same."
        />
      ),
    }),
  magicLink: (to: string, url: string) =>
    sendEmail({
      to,
      tag: "magic-link",
      subject: "Your AllShip AI sign-in link",
      react: (
        <ActionEmail
          preview="Sign in to AllShip AI"
          heading="Sign in to AllShip AI"
          intro="Use this link to sign in without a password. It works once."
          actionLabel="Sign in"
          url={url}
          footnote="The link expires in 10 minutes. If you did not ask to sign in, ignore this email."
        />
      ),
    }),
  otp: (to: string, code: string, type: "sign-in" | "email-verification" | "forget-password" | "change-email") => {
    const copy = {
      "sign-in": ["Your sign-in code", "Enter this code on the AllShip AI sign-in page."],
      "email-verification": ["Confirm your email", "Enter this code to confirm your email address."],
      "forget-password": ["Reset your password", "Enter this code to choose a new password."],
      "change-email": ["Confirm your new email", "Enter this code to confirm your new email address."],
    } as const;
    const [heading, intro] = copy[type];
    return sendEmail({
      to,
      tag: `otp-${type}`,
      subject: `${code} is your AllShip AI code`,
      react: (
        <CodeEmail
          heading={heading}
          intro={intro}
          code={code}
          footnote="The code expires in 10 minutes. Never share it with anyone, including AllShip staff."
        />
      ),
    });
  },
  invitation: (to: string, url: string, companyName: string, inviterName: string, role: string) =>
    sendEmail({
      to,
      tag: "invitation",
      subject: `${inviterName} invited you to ${companyName} on AllShip AI`,
      react: (
        <ActionEmail
          preview={`Join ${companyName} on AllShip AI`}
          heading={`Join ${companyName}`}
          intro={`${inviterName} added you as ${role === "driver" ? "a driver" : `a ${role}`} for ${companyName} on AllShip AI.`}
          actionLabel="Accept invitation"
          url={url}
          footnote="The invitation expires in 7 days."
        />
      ),
    }),
};
