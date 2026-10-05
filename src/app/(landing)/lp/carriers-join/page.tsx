import Link from "next/link";
import { CheckList } from "@/components/marketing/check-list";
import { CallLine, LpFaq, LpTheater, StickyCta, TrustRow } from "@/components/marketing/landing/lp-parts";
import {
  pickVariant,
  type HeadlineVariant,
  type SearchParams,
} from "@/components/marketing/landing/variants";
import { Media } from "@/components/marketing/media";
import { Container } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, badgeIcon, paymentsIcon, sellIcon } from "@/components/ui/icons.generated";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const metadata = buildMetadata({
  title: "Find Loads and Get Paid After Delivery",
  description:
    "Bid on moving, vehicle, freight and heavy equipment loads. Keep 100% of your bid, and get paid through Stripe after delivery. Free for FMCSA-verified carriers.",
  path: "/lp/carriers-join",
  noindex: true,
});

const signUp = "/sign-up?type=carrier";

const headlines = {
  default: {
    title: "Bid on loads. Keep 100% of your bid.",
    lead: "Shippers post moves, vehicles and freight. You set the price, and the payment is already in escrow when you start.",
  },
  "owner-operator": {
    title: "Loads for owner-operators, paid after delivery",
    lead: "No dispatcher cut. Bid on loads in your lanes and get paid through Stripe once the delivery is confirmed.",
  },
  "box-truck": {
    title: "Box truck loads near you",
    lead: "Moves, furniture and small freight sized for 16 to 26 ft trucks. Bid on the ones that fit your schedule.",
  },
} satisfies Record<string, HeadlineVariant>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const { h } = await searchParams;
  const v = pickVariant(headlines, h);

  return (
    <>
      <section className="medium:pt-12 medium:pb-16 pt-6 pb-12">
        <Container className="expanded:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] expanded:items-center large:gap-16 grid gap-10">
          <div>
            <h1 className="text-headline-lg medium:text-display-md large:text-display-lg font-normal tracking-tight text-balance">
              <RevealText>{v.title}</RevealText>
            </h1>
            <p
              className="text-body-lg text-on-surface-variant medium:mt-4 medium:text-title-lg medium:font-normal mt-3 text-pretty"
              {...enter(2)}
            >
              {v.lead}
            </p>
            <div
              className="medium:mt-8 medium:flex-row medium:items-center mt-6 flex flex-col gap-3"
              {...enter(3)}
            >
              <Button asChild size="lg">
                <Link href={signUp}>
                  Create a carrier account
                  <Icon icon={arrowForwardIcon} size={20} />
                </Link>
              </Button>
              <CallLine />
            </div>
            <div className="bg-surface-container-low medium:p-6 mt-8 rounded-lg p-5" {...enter(4)}>
              <p className="text-title-md text-on-surface">You&apos;ll need</p>
              <CheckList
                className="mt-3"
                items={[
                  "An active USDOT number, and MC authority if your operation needs it",
                  "Auto liability and cargo insurance",
                  "A bank account for Stripe payouts",
                ]}
              />
            </div>
          </div>
          <Media
            src="/images/truck-at-dock.jpg"
            alt="Truck backed up to a loading dock"
            width={960}
            height={1280}
            className="expanded:block hidden aspect-[4/5] overflow-hidden rounded-xl"
            enter={4}
            imgClassName="h-full"
            sizes="(min-width: 840px) 40vw, 0px"
          />
        </Container>
      </section>

      <section
        aria-label="Why haul with AllShip"
        className="border-outline-variant medium:py-12 border-y py-10"
      >
        <Container>
          <TrustRow
            items={[
              {
                icon: sellIcon,
                title: "Your price, your loads",
                text: "Bid what the job is worth to you. No forced dispatch.",
              },
              {
                icon: paymentsIcon,
                title: "100% of your bid",
                text: `Our ${site.platformFeePercent}% fee is charged to the shipper, not taken from you.`,
              },
              {
                icon: badgeIcon,
                title: "Free to join",
                text: "No subscription. Verification uses your FMCSA records.",
              },
            ]}
          />
        </Container>
      </section>

      <LpTheater
        id="paid"
        scene="carrierBoard"
        title="How you get paid"
        lead="The shipper pays before you roll, so you never chase an invoice."
        steps={[
          {
            title: "Win the bid",
            text: "The shipper accepts your bid and pays it into escrow through Stripe.",
          },
          {
            title: "Pick up and deliver",
            text: "Track the trip in the app and add proof of delivery: photos and a signature.",
          },
          {
            title: "Get paid",
            text: `The payout is sent when the shipper confirms delivery, or automatically after ${site.autoConfirmHours} hours with no dispute.`,
          },
        ]}
      />

      <LpFaq
        items={[
          {
            question: "What does it cost to join?",
            answer:
              "Nothing. Signing up, verification and bidding are free. The service fee is charged to the shipper on top of your bid.",
          },
          {
            question: "How long does verification take?",
            answer:
              "We check your USDOT and MC numbers against FMCSA records when you sign up. Stripe payout setup usually takes a few minutes with your business and bank details.",
          },
          {
            question: "What kinds of loads are posted?",
            answer:
              "Household moves, cars and other vehicles, palletized freight, heavy equipment, and truck-with-driver jobs.",
          },
          {
            question: "What if a shipper disputes a delivery?",
            answer:
              "The payout is held while we review evidence from both sides. Pickup and delivery photos in the app are your best protection.",
          },
        ]}
      />

      <StickyCta href={signUp} label="Create a carrier account" />
    </>
  );
}
