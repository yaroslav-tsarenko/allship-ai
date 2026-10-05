import "server-only";
import { ActionEmail } from "@/emails/action-email";
import { sendEmail } from "./send";

export const sendNewsletterConfirmation = (to: string, url: string) =>
  sendEmail({
    to,
    tag: "newsletter-confirm",
    subject: "Confirm your AllShip AI newsletter subscription",
    react: (
      <ActionEmail
        preview="Confirm your subscription"
        heading="One click to confirm"
        intro="Confirm that you want shipping guides and product updates from AllShip AI. We send about two emails a month."
        actionLabel="Confirm subscription"
        url={url}
        footnote="If you did not sign up, ignore this email and you will not hear from us."
      />
    ),
  });

export const sendLeadReceipt = (to: string, name: string, summary: string) =>
  sendEmail({
    to,
    tag: "quote-received",
    subject: "We received your shipping request",
    react: (
      <ActionEmail
        preview="Your request is in"
        heading={`Thanks, ${name}`}
        intro={`We received your request: ${summary}. Create your free account to publish it to verified carriers and start getting bids.`}
        actionLabel="Finish posting your load"
        url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://allship.ai"}/sign-up`}
        footnote="Questions? Reply to this email or call +1 (866) 228-2364."
      />
    ),
  });
