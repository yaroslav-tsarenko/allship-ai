import Link from "next/link";
import { CheckList } from "@/components/marketing/check-list";
import { CtaBand } from "@/components/marketing/cta-band";
import { Section, SectionHeading } from "@/components/marketing/section";
import { PageIntro } from "@/components/marketing/company/page-intro";
import { Button } from "@/components/ui/button";
import { Theater } from "@/components/theater";
import { EscrowShield, VerifiedBadge } from "@/components/theater/illustrations";
import { site } from "@/content/site";
import { buildMetadata } from "@/lib/seo";

const path = "/compare/uship-alternative";

export const metadata = buildMetadata({
  title: "uShip Alternative: What to Check in Any Marketplace",
  description: "Comparing marketplaces? Check fees, when the carrier is paid, how carriers are verified, proof of delivery and reviews. See how AllShip AI handles each.",
  path,
});

const rows = [
  {
    check: "Who pays the platform fee, and how much",
    why: "A fee hidden inside the carrier's price is hard to compare. A separate line lets you see what the haul costs and what the platform costs.",
    allship: `Shippers pay a ${site.platformFeePercent}% service fee on top of the carrier's bid, shown before you pay. Carriers pay no fee on their bid.`,
  },
  {
    check: "When the carrier gets your money",
    why: "If the carrier is paid before delivery, your leverage is gone when something goes wrong.",
    allship: `Payment is held in Stripe escrow from booking until the load is delivered and confirmed, or ${site.autoConfirmHours} hours after delivery.`,
  },
  {
    check: "How carriers are verified, and when",
    why: "Verification that happens after a carrier starts bidding protects nobody on the loads in between.",
    allship: "USDOT and MC are checked with FMCSA, insurance and a company Stripe account are required, all before the first bid.",
  },
  {
    check: "What proof of delivery is recorded",
    why: "A dispute is settled by records, not memories.",
    allship: "Pickup photos, a delivery photo and the receiver's signature are saved to the trip from the driver's phone.",
  },
  {
    check: "Who can write reviews",
    why: "Reviews are only useful if each one is tied to a real job.",
    allship: "Only the shipper on a completed load can review the carrier who moved it.",
  },
  {
    check: "Whether you can talk before you book",
    why: "Questions about access, packing or timing are cheaper before the truck arrives.",
    allship: "Every bid includes a message, and you can chat with the carrier before and after booking.",
  },
  {
    check: "What happens to your contact details",
    why: "Posting a move should not mean a week of sales calls.",
    allship: "The public load board shows city and state only. Your exact address and phone go to the carrier you book.",
  },
  {
    check: "How your account is protected",
    why: "Your account holds addresses and payment history.",
    allship: "2-step verification and passkeys are available on every account.",
  },
];

export default function UshipAlternativePage() {
  return (
    <>
      <PageIntro
        crumbs={[{ name: "Marketplace comparison", path }]}
        eyebrow="Comparing shipping marketplaces"
        title="Looking for a uShip alternative? Check these eight things first."
        lead="Most shipping marketplaces look alike on the homepage. The differences show up in the fine print: fees, payment timing and how carriers are checked. Use this list on any platform you are considering, including ours."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/quote">Get bids on AllShip AI</Link>
            </Button>
            <Button asChild size="lg" variant="outlined">
              <Link href="/how-it-works">How AllShip AI works</Link>
            </Button>
          </>
        }
      />

      <Section spacing="md" className="pt-0 medium:pt-0" labelledBy="table-heading">
        <h2 id="table-heading" className="sr-only">
          What to check and how AllShip AI handles it
        </h2>
        <div className="hidden overflow-hidden rounded-md border border-outline-variant expanded:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr className="text-label-lg text-on-surface-variant">
                <th scope="col" className="w-[26%] px-6 py-4 font-medium">
                  What to check
                </th>
                <th scope="col" className="w-[34%] px-6 py-4 font-medium">
                  Why it matters
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-primary">
                  How AllShip AI handles it
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.check} className="border-t border-outline-variant align-top">
                  <th scope="row" className="px-6 py-5 text-title-md font-medium text-on-surface">
                    {r.check}
                  </th>
                  <td className="px-6 py-5 text-body-lg text-pretty text-on-surface-variant">{r.why}</td>
                  <td className="px-6 py-5 text-body-lg text-pretty text-on-surface">{r.allship}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className="flex flex-col border-t border-outline-variant expanded:hidden">
          {rows.map((r, i) => (
            <li key={r.check} className="border-b border-outline-variant py-6">
              <h3 className="flex gap-3 text-title-lg font-normal text-on-surface">
                <span className="font-mono text-title-md text-on-surface-variant">{i + 1}</span>
                {r.check}
              </h3>
              <p className="mt-2 text-body-lg text-pretty text-on-surface-variant">{r.why}</p>
              <p className="mt-4 rounded-md bg-surface-container-low p-4 text-body-lg text-pretty text-on-surface">
                <span className="mb-1 block text-label-lg text-primary">AllShip AI</span>
                {r.allship}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="escrow-heading">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] large:gap-16">
          <div>
            <p className="mb-3 text-title-sm font-medium text-primary">Check 2, in practice</p>
            <SectionHeading id="escrow-heading">Where your money sits until delivery</SectionHeading>
            <p className="mt-5 text-body-xl text-pretty text-on-surface-variant">
              On AllShip AI you pay the bid plus the {site.platformFeePercent}% fee when you book. Stripe holds it during the trip, and the carrier receives 100% of the bid only after delivery is confirmed.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <div className="w-28 shrink-0">
                <EscrowShield />
              </div>
              <div className="w-28 shrink-0">
                <VerifiedBadge />
              </div>
            </div>
          </div>
          <Theater scene="escrowFlow" />
        </div>
      </Section>

      <Section tone="low" labelledBy="ask-heading">
        <div className="grid gap-10 expanded:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] expanded:gap-20">
          <div>
            <SectionHeading id="ask-heading">Questions to ask any platform before you pay</SectionHeading>
            <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">
              Terms change. Read the current fee page, terms of service and cancellation policy of every marketplace you compare, ours included.
            </p>
            <Link href="/legal/cancellation-refunds" className="mt-6 inline-block text-title-md text-primary underline-offset-4 hover:underline">
              AllShip AI cancellation and refund policy
            </Link>
          </div>
          <CheckList
            items={[
              "Is the total I see the total I pay, including every fee?",
              "Is my payment held until delivery, and who decides when it is released?",
              "Can I look up the carrier's USDOT and MC numbers myself?",
              "Does the carrier have cargo insurance, and what does it cover for my item?",
              "What happens to my money if the carrier cancels?",
              "How do I open a dispute, and what evidence will the platform look at?",
            ]}
          />
        </div>
      </Section>

      <Section spacing="md" width="narrow">
        <p className="text-body-md text-pretty text-on-surface-variant">
          Trademarks mentioned on this page belong to their owners. AllShip AI is not affiliated with or endorsed by them. This page describes AllShip AI&apos;s own features and
          does not make claims about any other company&apos;s service.
        </p>
      </Section>

      <CtaBand
        title="Put AllShip AI to the same test"
        description="Post your load for free, compare bids from verified carriers and see the full total before you pay."
        primary={{ label: "Get a quote", href: "/quote" }}
        secondary={{ label: "Read about safety", href: "/safety" }}
      />
    </>
  );
}
