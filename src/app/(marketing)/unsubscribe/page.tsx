import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";
import { readEmailToken } from "@/server/nurture/links";
import { emailStatus } from "@/server/nurture/preferences";
import { isSequenceId, sequences } from "@/server/nurture/schedule";
import { updateEmailPreference } from "./actions";

export const metadata: Metadata = { title: "Email preferences", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const doneCopy: Record<string, string> = {
  sequence: "Done. You won't get any more emails from this series.",
  marketing: "Done. You're unsubscribed from AllShip AI tips and reminders.",
  resubscribe: "You're subscribed again. Thanks for coming back.",
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = first(sp.t) ?? "";
  const token = readEmailToken(raw, "unsubscribe");
  const done = first(sp.done);

  if (!token) {
    return (
      <section className="mx-auto w-full max-w-[760px] px-4 py-16 medium:px-8 medium:py-24">
        <p className="text-title-sm font-medium text-primary">Email preferences</p>
        <h1 className="mt-4 text-headline-lg text-balance medium:text-display-sm">This link doesn&apos;t work</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant">
          The unsubscribe link may be incomplete. Open it again from the email, or write to{" "}
          <a href={`mailto:${site.email}?subject=Unsubscribe`} className="text-primary underline underline-offset-2">
            {site.email}
          </a>{" "}
          from the address you want removed and we&apos;ll take it off our lists.
        </p>
      </section>
    );
  }

  const sequence = isSequenceId(token.s) ? token.s : null;
  const def = sequence ? sequences[sequence] : null;
  const status = await emailStatus(token.e);
  const unsubscribed = status.suppression?.reason === "unsubscribed";
  const hardStopped = status.suppression && status.suppression.reason !== "unsubscribed";
  const seriesStopped = sequence ? status.optOuts.includes(sequence) : false;
  const defaultChoice = def?.category === "transactional" ? "sequence" : "marketing";

  return (
    <section className="mx-auto w-full max-w-[760px] px-4 py-16 medium:px-8 medium:py-24">
      <p className="text-title-sm font-medium text-primary">Email preferences</p>
      <h1 className="mt-4 text-headline-lg text-balance medium:text-display-sm">Choose what we send to {token.e}</h1>

      {done && doneCopy[done] ? (
        <p role="status" className="mt-6 rounded-sm bg-secondary-container px-4 py-3 text-body-md text-on-secondary-container">
          {doneCopy[done]}
        </p>
      ) : null}

      {hardStopped ? (
        <p className="mt-6 text-body-lg text-on-surface-variant">
          We stopped sending to this address after {status.suppression?.reason === "bounced" ? "an email to it bounced" : "it was reported as spam"}. To start again, email{" "}
          <a href={`mailto:${site.email}`} className="text-primary underline underline-offset-2">
            {site.email}
          </a>
          .
        </p>
      ) : unsubscribed || (seriesStopped && def?.category === "transactional") ? (
        <form action={updateEmailPreference} className="mt-8 flex flex-col gap-4 border-t border-outline-variant pt-6">
          <input type="hidden" name="t" value={raw} />
          <input type="hidden" name="choice" value="resubscribe" />
          <p className="text-body-lg text-on-surface-variant">
            {unsubscribed ? "This address is unsubscribed from tips and reminders." : "These reminders are turned off."} Changed your mind?
          </p>
          <div>
            <Button type="submit" variant="outlined">
              Subscribe again
            </Button>
          </div>
        </form>
      ) : (
        <form action={updateEmailPreference} className="mt-8 flex flex-col gap-6 border-t border-outline-variant pt-6">
          <input type="hidden" name="t" value={raw} />
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-3 text-title-md text-on-surface">What do you want to stop?</legend>
            {def ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-sm px-2 py-3 hover:bg-on-surface/4">
                <input type="radio" name="choice" value="sequence" defaultChecked={defaultChoice === "sequence"} className="mt-1 size-4 accent-primary" />
                <span>
                  <span className="block text-body-lg text-on-surface">Only &ldquo;{def.label}&rdquo; emails</span>
                  <span className="block text-body-md text-on-surface-variant">{def.description}.</span>
                </span>
              </label>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3 rounded-sm px-2 py-3 hover:bg-on-surface/4">
              <input type="radio" name="choice" value="marketing" defaultChecked={defaultChoice === "marketing"} className="mt-1 size-4 accent-primary" />
              <span>
                <span className="block text-body-lg text-on-surface">All tips and reminders</span>
                <span className="block text-body-md text-on-surface-variant">Quote reminders, load tips, review requests, carrier setup guides and the newsletter.</span>
              </span>
            </label>
          </fieldset>
          <p className="text-body-md text-on-surface-variant">
            We&apos;ll still send what you need to use your account or finish a booking: sign-in links, receipts, and updates about loads you&apos;ve booked.
          </p>
          <div>
            <Button type="submit">Unsubscribe</Button>
          </div>
        </form>
      )}

      <p className="mt-10 text-body-md text-on-surface-variant">
        Have an account? Choose which notification emails you get in{" "}
        <Link href="/app/settings/notifications" className="text-primary underline underline-offset-2">
          email settings
        </Link>
        . Questions? Call {site.phone.display} or email {site.email}.
      </p>
    </section>
  );
}
