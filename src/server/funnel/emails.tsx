import "server-only";
import { ActionEmail } from "@/emails/action-email";
import { sendEmail } from "@/server/email/send";
import { PUBLISH_LINK_HOURS } from "./links";

export function sendPublishConfirmation(to: string, { url, publicId, summary, firstName, count }: { url: string; publicId: string; summary: string; firstName?: string | null; count: number }) {
  const more = count > 1 ? ` The same link publishes your other ${count - 1} waiting ${count === 2 ? "load" : "loads"} too.` : "";
  return sendEmail({
    to,
    tag: "publish-confirm",
    subject: `Confirm to publish your load ${publicId}`,
    react: (
      <ActionEmail
        preview={`One click and ${publicId} goes live to verified carriers`}
        heading={firstName ? `${firstName}, confirm your load` : "Confirm your load"}
        intro={`Your load ${publicId} (${summary}) is saved. Confirm your email and we publish it to verified carriers, who start bidding right away.${more} Posting is free. You pay only after you accept a bid, and the payment waits in escrow until delivery.`}
        actionLabel={`Publish ${publicId}`}
        url={url}
        footnote={`The link works once and expires in ${PUBLISH_LINK_HOURS} hours. It also signs you in to your AllShip AI account. If you did not post this load, ignore this email and it stays unpublished.`}
      />
    ),
  });
}
