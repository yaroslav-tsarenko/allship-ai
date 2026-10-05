import Link from "next/link";
import { Container } from "@/components/marketing/section";
import { Theater } from "@/components/theater";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkCircleIcon } from "@/components/ui/icons.generated";
import { categoryBySlug } from "@/content/categories";
import { buildMetadata } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const metadata = buildMetadata({
  title: "Request received",
  description:
    "We received your shipping request. Create a free account to publish it to verified carriers and start receiving bids.",
  path: "/quote/thanks",
  noindex: true,
});

export default async function QuoteThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; category?: string }>;
}) {
  const { email, category } = await searchParams;
  const c = category ? categoryBySlug(category) : undefined;
  const signUp = `/sign-up${email ? `?email=${encodeURIComponent(email.slice(0, 200))}` : ""}`;
  return (
    <div className="medium:py-24 py-16">
      <Container width="narrow">
        <Icon icon={checkCircleIcon} filled size={48} className="animate-pop-in text-success" />
        <h1 className="text-display-sm mt-6 font-normal">
          <RevealText delay={120}>We have your request</RevealText>
        </h1>
        <p className="text-body-lg text-on-surface-variant mt-4 max-w-[640px]" {...enter(3)}>
          {c ? `Your ${c.name.toLowerCase()} request is saved.` : "Your request is saved."} We sent a summary
          to {email ? <span className="text-on-surface">{email.slice(0, 200)}</span> : "your email"}. Create a
          free account to publish it to verified carriers. Bids usually start arriving after the load is live.
        </p>
        <ol className="border-outline-variant mt-10 flex flex-col gap-0 border-t" {...enter(4)}>
          {[
            ["Create your account", "Use the same email so we can attach this request to your account."],
            ["Publish the load", "Review the details and add exact addresses and photos."],
            ["Compare bids", "See price, pickup window, authority status and reviews from completed loads."],
            ["Pay into escrow", "The carrier is paid after you confirm delivery."],
          ].map(([title, body], i) => (
            <li key={title} className="border-outline-variant grid grid-cols-[48px_1fr] gap-4 border-b py-5">
              <span className="text-title-lg text-primary font-mono">{i + 1}</span>
              <span>
                <span className="text-title-md block">{title}</span>
                <span className="text-body-md text-on-surface-variant block">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3" {...enter(5)}>
          <Button asChild size="lg">
            <Link href={signUp}>Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="text">
            <Link href="/how-it-works">How AllShip works</Link>
          </Button>
        </div>
      </Container>
      <Container width="narrow" className="medium:mt-20 mt-16">
        <h2 className="text-headline-sm text-on-surface font-normal">
          What you&apos;ll see once it&apos;s live
        </h2>
        <p className="text-body-lg text-on-surface-variant mt-2 max-w-[640px] text-pretty">
          Bids from verified carriers arrive on your load. Sort them, accept one and pay into escrow. Demo
          data is illustrative.
        </p>
        <Theater scene="bidsCompare" className="mt-8" />
      </Container>
    </div>
  );
}
