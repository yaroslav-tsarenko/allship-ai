import { site } from "@/content/site";
import { NurtureEmail, type NurtureEmailProps, type NurtureFact, type NurtureFooter } from "./nurture-email";

type LoadRef = { publicId?: string | null; title?: string | null; route?: string | null };

export type NurtureMessage =
  | { template: "verify_publish"; step: number; firstName: string | null; load: LoadRef }
  | { template: "abandoned_form"; step: number; firstName: string | null; formLabel: string; summary: string | null; saved: boolean }
  | { template: "load_intro"; load: LoadRef & { publicId: string }; closesAt: string | null }
  | { template: "load_bids"; load: LoadRef & { publicId: string }; bidCount: number; lowestBid: string | null }
  | { template: "load_no_bids"; load: LoadRef & { publicId: string }; hasTargetPrice: boolean; hasPhotos: boolean }
  | { template: "load_closing"; load: LoadRef & { publicId: string }; bidCount: number; closesAt: string; awaitingPayment: boolean }
  | { template: "rate_carrier"; load: LoadRef & { publicId: string }; carrierName: string }
  | { template: "next_shipment"; firstName: string | null }
  | { template: "carrier_verification"; companyName: string; status: "verified" | "pending" | "failed" }
  | { template: "carrier_payouts"; companyName: string }
  | { template: "carrier_rates"; companyName: string }
  | { template: "carrier_bidding"; companyName: string; verified: boolean };

export type NurtureTemplate = NurtureMessage["template"];

const fee = `${site.platformFeePercent}%`;
const hi = (name: string | null) => (name ? `Hi ${name},` : "Hi,");
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function loadFacts(load: LoadRef, extra: NurtureFact[] = []): NurtureFact[] {
  const facts: NurtureFact[] = [];
  if (load.publicId) facts.push({ label: "Load", value: load.title ? `${load.publicId} · ${load.title}` : load.publicId });
  if (load.route) facts.push({ label: "Route", value: load.route });
  return [...facts, ...extra];
}

type Composed = Omit<NurtureEmailProps, "url" | "footer"> & { subject: string };

export function composeNurture(message: NurtureMessage): Composed {
  switch (message.template) {
    case "verify_publish": {
      const id = message.load.publicId;
      const name = id ? `load ${id}` : "your load";
      const variants: Composed[] = [
        {
          subject: id ? `Your load ${id} isn't live yet — confirm your email` : "Your load isn't live yet — confirm your email",
          preview: "One click and carriers can see it",
          heading: id ? `Confirm your email to publish ${id}` : "Confirm your email to publish your load",
          paragraphs: [hi(message.firstName), `We saved ${name}, but carriers can't see it until you confirm this email address. One click confirms it, and we publish the load right after.`],
          facts: loadFacts(message.load),
          actionLabel: "Confirm and publish",
          after: "The button signs you in and confirms this address. If you didn't post a load on AllShip AI, you can ignore this email.",
        },
        {
          subject: id ? `Reminder: ${id} is saved but not published` : "Reminder: your load is saved but not published",
          preview: "Carriers can only bid on published loads",
          heading: "Your load is saved, not published",
          paragraphs: [hi(message.firstName), `Carriers can only bid on published loads. Confirm your email and ${name} goes on the load board right away. Posting is free, and you don't pay anything until you accept a bid.`],
          facts: loadFacts(message.load),
          actionLabel: "Confirm and publish",
        },
        {
          subject: id ? `Last reminder: confirm your email to publish ${id}` : "Last reminder: confirm your email to publish your load",
          preview: "This is the last reminder we'll send",
          heading: "Last reminder about your load",
          paragraphs: [hi(message.firstName), `This is the last reminder we'll send about ${name}. If you still need it shipped, confirm your email and it goes live. If your plans changed, there's nothing to do.`],
          facts: loadFacts(message.load),
          actionLabel: "Confirm and publish",
        },
      ];
      return variants[Math.min(message.step, variants.length - 1)]!;
    }
    case "abandoned_form": {
      const what = message.formLabel;
      const facts = message.summary ? [{ label: "Your request", value: message.summary }] : undefined;
      const saved = message.saved ? "We kept what you entered, so you only need to fill in the rest." : "The rest of the form is a few short questions.";
      const variants: Composed[] = [
        {
          subject: `Finish your ${what} quote`,
          preview: "Pick up where you left off",
          heading: "Pick up where you left off",
          paragraphs: [hi(message.firstName), `You started a ${what} request but didn't send it. ${saved}`, "Sending it is free. You see bids from verified carriers and pay nothing until you accept one."],
          facts,
          actionLabel: "Finish your quote",
        },
        {
          subject: `Your ${what} quote: how it works from here`,
          preview: "Free to post, you choose the carrier",
          heading: "What happens after you send it",
          paragraphs: [hi(message.firstName), `Your ${what} request is still unfinished. Here's what happens once you send it:`],
          facts,
          list: [
            { title: "Carriers bid", body: "Carriers whose USDOT and MC records we've checked send a price and dates." },
            { title: "You choose", body: "Compare price, reviews and completed loads, and ask questions in chat before you book." },
            { title: "Payment waits in escrow", body: `You pay the bid plus a ${fee} service fee at booking. We release it to the carrier after delivery.` },
          ],
          actionLabel: "Finish your quote",
        },
        {
          subject: `Still need a ${what} quote?`,
          preview: "Last reminder about your unfinished request",
          heading: "Still need this shipped?",
          facts,
          paragraphs: [hi(message.firstName), `This is the last reminder about your ${what} request. If you still need it, finishing takes a few minutes and you can compare bids before you commit. If your plans changed, there's nothing to do.`],
          actionLabel: "Finish your quote",
        },
      ];
      return variants[Math.min(message.step, variants.length - 1)]!;
    }
    case "load_intro":
      return {
        subject: `What happens next with ${message.load.publicId}`,
        preview: "How bids, verification and escrow work",
        heading: "Your load is live. Here's what happens next.",
        paragraphs: ["Carriers can see your load on the AllShip AI board now. Three things to know:"],
        facts: loadFacts(message.load, message.closesAt ? [{ label: "Bidding closes", value: message.closesAt }] : []),
        list: [
          { title: "Carriers send bids", body: "Each bid has a price plus pickup and delivery dates. We email you when a new one comes in." },
          { title: "Check who you're booking", body: "Every bid shows the carrier's FMCSA status, reviews and completed loads. Ask questions in chat before you accept." },
          { title: "Your payment waits in escrow", body: `When you book, you pay the bid plus a ${fee} service fee. We hold it until delivery is confirmed, then pay the carrier.` },
        ],
        actionLabel: "View your load",
      };
    case "load_bids":
      return {
        subject: `You have ${plural(message.bidCount, "bid", "bids")} on ${message.load.publicId} — here's how to compare`,
        preview: message.lowestBid ? `Lowest bid so far: ${message.lowestBid}` : "Compare before you book",
        heading: `${plural(message.bidCount, "bid", "bids")} on your load`,
        paragraphs: [message.lowestBid ? `The lowest bid so far is ${message.lowestBid}. Price matters, but check these before you book:` : "Check these before you book:"],
        facts: loadFacts(message.load),
        list: [
          { title: "Verification", body: "Look for a verified FMCSA status. It means the carrier's USDOT and MC records checked out." },
          { title: "Track record", body: "Reviews and completed loads on AllShip AI show how the carrier handled similar jobs." },
          { title: "Dates", body: "Make sure the pickup and delivery dates in the bid work for you. Ask in chat if anything is unclear." },
        ],
        actionLabel: "Compare bids",
        after: `The total you pay at booking is the bid plus a ${fee} service fee, held in escrow until delivery.`,
      };
    case "load_no_bids": {
      const list = [
        ...(message.hasPhotos ? [] : [{ title: "Add photos", body: "Photos of the items, vehicle or freight answer most carrier questions before they ask." }]),
        { title: "Keep dates flexible", body: "A wider pickup window lets carriers fit your load into a route they already run." },
        ...(message.hasTargetPrice ? [] : [{ title: "Set a target price", body: "A target price tells carriers what you expect to pay and filters out bids far above it." }]),
        { title: "Check the details", body: "Accurate size, weight and access notes (stairs, gates, loading dock) help carriers price with confidence." },
      ];
      return {
        subject: `No bids yet on ${message.load.publicId} — a few ways to get bids faster`,
        preview: "Small changes that help carriers say yes",
        heading: "No bids yet. A few things that help.",
        paragraphs: ["Your load is live, but no carrier has bid yet. These changes usually make a load easier to say yes to:"],
        facts: loadFacts(message.load),
        list,
        actionLabel: "View your load",
        after: "To change the dates or details of a published load, cancel it and post it again. Questions? Reply to this email.",
      };
    }
    case "load_closing":
      if (message.awaitingPayment) {
        return {
          subject: `Finish booking ${message.load.publicId}`,
          preview: "Your load is booked once payment goes through",
          heading: "You picked a bid. Finish booking.",
          paragraphs: ["Your load isn't booked until payment goes through. Your payment is held in escrow and only released to the carrier after delivery."],
          facts: loadFacts(message.load),
          actionLabel: "Finish booking",
        };
      }
      return {
        subject: message.bidCount > 0 ? `Ready to book? Bids on ${message.load.publicId} close ${message.closesAt}` : `Bidding on ${message.load.publicId} closes ${message.closesAt}`,
        preview: message.bidCount > 0 ? `${plural(message.bidCount, "bid", "bids")} waiting` : "You can relist it if no one bids",
        heading: message.bidCount > 0 ? "Ready to book?" : "Bidding closes soon",
        paragraphs:
          message.bidCount > 0
            ? [`You have ${plural(message.bidCount, "bid", "bids")} on your load. Bidding closes ${message.closesAt}, and open bids expire with it. Accept the one that fits to lock in the carrier and dates.`]
            : [`Bidding closes ${message.closesAt}. If it closes without bids, you can relist the load from your dashboard in one step.`],
        facts: loadFacts(message.load, [{ label: "Bidding closes", value: message.closesAt }]),
        actionLabel: message.bidCount > 0 ? "Review bids" : "View your load",
      };
    case "rate_carrier":
      return {
        subject: `How did ${message.carrierName} do on ${message.load.publicId}?`,
        preview: "A one-minute review helps other shippers",
        heading: "Rate your carrier",
        paragraphs: [`${message.load.publicId} is complete. How did ${message.carrierName} do? A star rating and a sentence or two help other shippers choose, and the carrier can reply.`],
        facts: loadFacts(message.load, [{ label: "Carrier", value: message.carrierName }]),
        actionLabel: "Leave a review",
      };
    case "next_shipment":
      return {
        subject: "Shipping something else?",
        preview: "Post your next load the same way",
        heading: "Your next shipment works the same way",
        paragraphs: [
          hi(message.firstName),
          `Moves, vehicles, freight and equipment all go through the same steps: post for free, compare bids from verified carriers, and pay into escrow only when you book. The service fee is ${fee} of the bid.`,
          "If a friend or coworker needs something shipped, feel free to forward this email.",
        ],
        actionLabel: "Get a quote",
      };
    case "carrier_verification": {
      const byStatus = {
        verified: {
          subject: `${message.companyName} is verified on AllShip AI`,
          heading: "You're verified",
          body: "Your USDOT and MC records checked out, so you can bid on open loads now. Two more steps get you paid faster: set up payouts and add your rates.",
          action: "Find loads",
        },
        pending: {
          subject: `We're checking the USDOT record for ${message.companyName}`,
          heading: "Verification is in progress",
          body: "We're checking your USDOT and MC records with FMCSA. When it can't be done automatically, our team reviews it by hand and emails you the result. You can set up payouts and rates while you wait.",
          action: "Check your status",
        },
        failed: {
          subject: `We couldn't verify ${message.companyName} yet`,
          heading: "Verification needs attention",
          body: "Your USDOT record didn't match the details you entered, or the authority isn't active. Check your legal name and USDOT number. If they're right, reply to this email and we'll take a look.",
          action: "Review company details",
        },
      }[message.status];
      return { subject: byStatus.subject, preview: byStatus.heading, heading: byStatus.heading, paragraphs: [byStatus.body], actionLabel: byStatus.action };
    }
    case "carrier_payouts":
      return {
        subject: "Set up payouts so you can get paid",
        preview: "Connect a bank account through Stripe",
        heading: "Set up payouts",
        paragraphs: [
          `Shippers pay into escrow when they book ${message.companyName}. After delivery is confirmed, we send the money to your bank account. You keep 100% of your bid; the shipper pays the ${fee} service fee.`,
          "Connect a bank account through Stripe now so your first payout isn't held.",
        ],
        actionLabel: "Set up payouts",
      };
    case "carrier_rates":
      return {
        subject: "Add your rates to get instant-quote jobs",
        preview: "Shippers can book you without waiting for a bid",
        heading: "Add your rate card",
        paragraphs: [
          "With a rate card, shippers on matching routes see a price from you right away, without waiting for a bid. You set the rate per cubic foot by distance, plus packing and storage if you offer them.",
          "You can change your rates or turn instant quotes off at any time.",
        ],
        actionLabel: "Set your rates",
      };
    case "carrier_bidding":
      return {
        subject: "How to write a bid shippers accept",
        preview: "Four habits of bids that win",
        heading: "How to write a winning bid",
        paragraphs: [message.verified ? "Shippers compare price, dates and trust. Bids that win usually do these four things:" : "Once you're verified, you can bid on open loads. Bids that win usually do these four things:"],
        list: [
          { title: "Price the whole job", body: "Include fuel, tolls and any extra labor so there are no surprises after booking." },
          { title: "Give realistic dates", body: "A pickup date you can keep beats an early date you might miss." },
          { title: "Say something specific", body: "Mention your equipment, experience with this kind of load, or your route. Skip generic text." },
          { title: "Answer questions fast", body: "Shippers often message two or three carriers. Quick replies win jobs." },
        ],
        actionLabel: "Browse open loads",
      };
  }
}

export function NurtureMessageEmail({ message, url, footer }: { message: NurtureMessage; url: string; footer: NurtureFooter }) {
  const composed = composeNurture(message);
  return <NurtureEmail preview={composed.preview} heading={composed.heading} paragraphs={composed.paragraphs} facts={composed.facts} list={composed.list} actionLabel={composed.actionLabel} after={composed.after} url={url} footer={footer} />;
}

export const sampleMessages: NurtureMessage[] = [
  { template: "verify_publish", step: 0, firstName: "Dana", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" } },
  { template: "abandoned_form", step: 1, firstName: null, formLabel: "vehicle transport", summary: "2019 Honda Civic, Miami, FL → Atlanta, GA, Oct 14", saved: false },
  { template: "load_intro", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" }, closesAt: "Fri, Oct 9" },
  { template: "load_bids", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" }, bidCount: 3, lowestBid: "$1,840.00" },
  { template: "load_no_bids", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" }, hasTargetPrice: false, hasPhotos: false },
  { template: "load_closing", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" }, bidCount: 2, closesAt: "Fri, Oct 9", awaitingPayment: false },
  { template: "rate_carrier", load: { publicId: "AS-7K2M9Q", title: "2-bedroom apartment move", route: "Austin, TX → Denver, CO" }, carrierName: "Lone Star Movers" },
  { template: "next_shipment", firstName: "Dana" },
  { template: "carrier_verification", companyName: "Lone Star Movers", status: "pending" },
  { template: "carrier_payouts", companyName: "Lone Star Movers" },
  { template: "carrier_rates", companyName: "Lone Star Movers" },
  { template: "carrier_bidding", companyName: "Lone Star Movers", verified: true },
];

const previewFooter: NurtureFooter = { reason: "You're getting this because you posted a load on AllShip AI.", unsubscribeUrl: "https://allship.ai/unsubscribe?t=example", unsubscribeLabel: "Unsubscribe", settingsUrl: "https://allship.ai/app/settings/notifications" };

export default function Preview() {
  return <NurtureMessageEmail message={sampleMessages[0]!} url="https://allship.ai/api/auth/magic-link/verify?token=example&callbackURL=%2Fload%2Fclaim" footer={previewFooter} />;
}
